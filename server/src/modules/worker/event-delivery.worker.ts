import { Worker } from 'bullmq';

import { redisConnection } from '@server/shared/queue/index.js';
import { EVENT_DELIVERY_QUEUE_NAME, type EventDeliveryJob } from '@server/shared/events/queue/index.js';
import { processEventDelivery } from '@server/shared/events/processor/index.js';

const WORKER_CONCURRENCY = 10;

const LOCK_DURATION_MS = 30_000;
const STALLED_INTERVAL_MS = 30_000;
const MAX_STALLED_COUNT = 1;

export const eventDeliveryWorker = new Worker<EventDeliveryJob>(
  EVENT_DELIVERY_QUEUE_NAME,
  async (job) => {
    const maxAttempts = job.opts.attempts ?? 1;
    const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

    await processEventDelivery({
      deliveryId: job.data.deliveryId,
      bullmqJobId: job.id ?? null,
      executionType: null,
      isFinalAttempt,
    });
  },
  {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY,

    // BullMQ job lock and stalled-job recovery.
    lockDuration: LOCK_DURATION_MS,
    stalledInterval: STALLED_INTERVAL_MS,
    maxStalledCount: MAX_STALLED_COUNT,
  },
);

eventDeliveryWorker.on('completed', (job) => {
  console.info(`[Event Worker] Delivery job ${job.id} completed.`);
});

eventDeliveryWorker.on('failed', (job, error) => {
  console.error(`[Event Worker] Delivery job ${job?.id} failed:`, error);
});

eventDeliveryWorker.on('stalled', (jobId, prevState) => {
  console.warn(`[Event Worker] Job ${jobId} stalled. Previous state: ${prevState}.`);
});

eventDeliveryWorker.on('error', (error) => {
  console.error('[Event Worker] Worker error:', error);
});
