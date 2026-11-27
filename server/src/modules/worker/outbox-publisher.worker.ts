import { setTimeout as delay } from 'node:timers/promises';

import { publishPendingOutboxEvents } from '../../shared/events/publisher/index.js';

const DEFAULT_POLL_INTERVAL_MS = 1000;

/**
 * Continuously polls the outbox and publishes pending events.
 */
export async function runOutboxPublisherWorker(
  signal: AbortSignal,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
): Promise<void> {
  while (!signal.aborted) {
    try {
      const result = await publishPendingOutboxEvents();

      if (result.published > 0 || result.failed > 0) {
        console.info('[Outbox Publisher]', result);
      }
    } catch (error) {
      console.error('[Outbox Publisher] Polling cycle failed:', error);
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

  console.info('[Outbox Publisher] Worker stopped.');
}
