import { setTimeout as delay } from 'node:timers/promises';

import { reconcileEventDeliveries } from '@server/shared/events/reconciliation/index.js';

const DEFAULT_POLL_INTERVAL_MS = 30_000;

export async function runDeliveryReconciliationWorker(
  signal: AbortSignal,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
): Promise<void> {
  while (!signal.aborted) {
    try {
      const result = await reconcileEventDeliveries();

      if (result.recovered > 0 || result.markedFailed > 0 || result.completedJobsRemoved > 0 || result.errors > 0) {
        console.info('[Delivery Reconciliation]', result);
      }
    } catch (error) {
      console.error('[Delivery Reconciliation] Polling cycle failed:', error);
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

  console.info('[Delivery Reconciliation] Worker stopped.');
}
