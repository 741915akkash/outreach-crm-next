import { beforeEach, describe, expect, it, vi } from 'vitest';

const { publishPendingOutboxEvents } = vi.hoisted(() => ({
  publishPendingOutboxEvents: vi.fn(),
}));

vi.mock('../../../../src/shared/events/publisher/index.js', () => ({
  publishPendingOutboxEvents,
}));

import { runOutboxPublisherWorker } from '@server/modules/worker/outbox-publisher.worker.js';

describe('Outbox Publisher Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('does not publish when already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await runOutboxPublisherWorker(controller.signal);

    expect(publishPendingOutboxEvents).not.toHaveBeenCalled();
  });

  it('publishes pending events and logs the result', async () => {
    const controller = new AbortController();

    publishPendingOutboxEvents.mockImplementation(async () => {
      controller.abort();

      return { published: 3, failed: 0 };
    });

    await runOutboxPublisherWorker(controller.signal);

    expect(publishPendingOutboxEvents).toHaveBeenCalledOnce();
    expect(console.info).toHaveBeenCalledWith('[Outbox Publisher]', { published: 3, failed: 0 });
    expect(console.info).toHaveBeenCalledWith('[Outbox Publisher] Worker stopped.');
  });

  it('does not log when no events were published or failed', async () => {
    const controller = new AbortController();

    publishPendingOutboxEvents.mockImplementation(async () => {
      controller.abort();

      return { published: 0, failed: 0 };
    });

    await runOutboxPublisherWorker(controller.signal);

    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith('[Outbox Publisher] Worker stopped.');
  });

  it('continues polling after a publishing error', async () => {
    const controller = new AbortController();

    publishPendingOutboxEvents
      .mockRejectedValueOnce(new Error('Database unavailable'))
      .mockImplementationOnce(async () => {
        controller.abort();

        return { published: 0, failed: 1 };
      });

    await runOutboxPublisherWorker(controller.signal, 0);

    expect(publishPendingOutboxEvents).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith('[Outbox Publisher] Polling cycle failed:', expect.any(Error));
  });

  it('exits when aborted during the polling delay', async () => {
    const controller = new AbortController();

    publishPendingOutboxEvents.mockResolvedValue({
      published: 0,
      failed: 0,
    });

    const workerPromise = runOutboxPublisherWorker(controller.signal, 60_000);

    setTimeout(() => controller.abort(), 50);

    await workerPromise;

    expect(publishPendingOutboxEvents).toHaveBeenCalledOnce();
    expect(console.info).toHaveBeenCalledWith('[Outbox Publisher] Worker stopped.');
  });
});
