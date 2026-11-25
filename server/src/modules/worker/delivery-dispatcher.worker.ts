import { setTimeout as delay } from 'node:timers/promises';

import { dispatchPendingDeliveries } from '@server/shared/events/dispatcher/index.js';

const DEFAULT_POLL_INTERVAL_MS = 1000;

/**
 * Continuously polls PostgreSQL for pending deliveries
 * and dispatches them to BullMQ.
 */
export async function runDeliveryDispatcherWorker(
  signal: AbortSignal,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
): Promise<void> {
  while (!signal.aborted) {
    try {
      const result = await dispatchPendingDeliveries();

      if (result.dispatched > 0 || result.reconciliationRequired > 0 || result.failed > 0) {
        console.info('[Delivery Dispatcher]', result);
      }
    } catch (error) {
      console.error('[Delivery Dispatcher] Polling cycle failed:', error);
    }

    if (signal.aborted) {
      break;
    }

    try {
      await delay(pollIntervalMs, undefined, { signal });
    } catch (error) {
      if (!signal.aborted) {
        throw error;
      }
    }
  }

  console.info('[Delivery Dispatcher] Worker stopped.');
}
