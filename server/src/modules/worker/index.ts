import { prisma } from '../../shared/db/client.js';
import { redisConnection } from '@server/shared/queue/index.js';
import { eventDeliveryQueue } from '@server/shared/events/queue/index.js';

import { registerSubscribers } from './bootstrap/register-subscribers.js';
import { runOutboxPublisherWorker } from './outbox-publisher.worker.js';
import { runDeliveryDispatcherWorker } from './delivery-dispatcher.worker.js';
import { runDeliveryReconciliationWorker } from './reconciliation.worker.js';
import { eventDeliveryWorker } from './event-delivery.worker.js';

const controller = new AbortController();

const pollIntervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 1000);

const reconciliationPollIntervalMs = Number(process.env.RECONCILIATION_POLL_INTERVAL_MS ?? 30_000);

function shutdown(signal: string): void {
  if (controller.signal.aborted) {
    return;
  }

  console.info(`[Worker] Received ${signal}. Shutting down...`);

  controller.abort();
}

function runWorker(name: string, worker: Promise<void>): Promise<void> {
  return worker.catch((error) => {
    console.error(`[Worker] ${name} failed unexpectedly:`, error);
    shutdown(`${name} failure`);
    throw error;
  });
}

/**
 * Starts the background worker process.
 */
async function startWorker(): Promise<void> {
  registerSubscribers();

  if (!Number.isFinite(pollIntervalMs) || pollIntervalMs <= 0) {
    throw new Error('OUTBOX_POLL_INTERVAL_MS must be a positive number.');
  }

  if (!Number.isFinite(reconciliationPollIntervalMs) || reconciliationPollIntervalMs <= 0) {
    throw new Error('RECONCILIATION_POLL_INTERVAL_MS must be a positive number.');
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    console.info('[Worker] PostgreSQL connected successfully.');

    await redisConnection.ping();

    console.info('[Worker] Redis connected successfully.');

    await eventDeliveryWorker.waitUntilReady();

    console.info('[Worker] Event delivery worker running.');

    console.info(`[Worker] Outbox publisher polling every ${pollIntervalMs}ms.`);

    console.info(`[Worker] Delivery dispatcher polling every ${pollIntervalMs}ms.`);

    console.info(`[Worker] Delivery reconciliation polling every ${reconciliationPollIntervalMs}ms.`);

    const results = await Promise.allSettled([
      runWorker('Outbox Publisher', runOutboxPublisherWorker(controller.signal, pollIntervalMs)),
      runWorker('Delivery Dispatcher', runDeliveryDispatcherWorker(controller.signal, pollIntervalMs)),
      runWorker(
        'Delivery Reconciliation',
        runDeliveryReconciliationWorker(controller.signal, reconciliationPollIntervalMs),
      ),
    ]);

    const failedWorker = results.find((result) => result.status === 'rejected');

    if (failedWorker?.status === 'rejected') {
      throw failedWorker.reason;
    }
  } finally {
    const cleanupTasks: Array<[string, () => Promise<unknown>]> = [
      ['event delivery worker', () => eventDeliveryWorker.close()],
      ['event delivery queue', () => eventDeliveryQueue.close()],
      ['Redis connection', () => redisConnection.quit()],
      ['PostgreSQL connection', () => prisma.$disconnect()],
    ];

    let cleanupFailed = false;

    for (const [name, cleanup] of cleanupTasks) {
      console.info(`[Worker] Closing ${name}...`);

      try {
        await cleanup();
      } catch (error) {
        cleanupFailed = true;
        console.error(`[Worker] Failed to close ${name}:`, error);
      }
    }

    if (cleanupFailed) {
      process.exitCode = 1;
    }

    console.info('[Worker] Shutdown complete.');
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

void startWorker().catch((error) => {
  console.error('[Worker] Failed:', error);
  process.exitCode = 1;
});
