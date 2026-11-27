import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dispatchPendingDeliveries: vi.fn(),
  reconcileEventDeliveries: vi.fn(),
}));

vi.mock('@server/shared/events/dispatcher/index.js', () => ({
  dispatchPendingDeliveries: mocks.dispatchPendingDeliveries,
}));

vi.mock('@server/shared/events/reconciliation/index.js', () => ({
  reconcileEventDeliveries: mocks.reconcileEventDeliveries,
}));

import { runDeliveryDispatcherWorker } from '@server/modules/worker/delivery-dispatcher.worker.js';
import { runDeliveryReconciliationWorker } from '@server/modules/worker/reconciliation.worker.js';

describe('Background Polling Workers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Delivery Dispatcher Worker', () => {
    it('runs a polling cycle and stops when aborted', async () => {
      const controller = new AbortController();

      mocks.dispatchPendingDeliveries.mockImplementationOnce(async () => {
        controller.abort();

        return {
          dispatched: 2,
          skipped: 0,
          reconciliationRequired: 0,
          failed: 0,
        };
      });

      await runDeliveryDispatcherWorker(controller.signal, 10);

      expect(mocks.dispatchPendingDeliveries).toHaveBeenCalledTimes(1);
    });

    it('does not run when already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      await runDeliveryDispatcherWorker(controller.signal, 10);

      expect(mocks.dispatchPendingDeliveries).not.toHaveBeenCalled();
    });

    it('continues after a polling error and stops on abort', async () => {
      const controller = new AbortController();

      mocks.dispatchPendingDeliveries
        .mockRejectedValueOnce(new Error('Database unavailable'))
        .mockImplementationOnce(async () => {
          controller.abort();

          return {
            dispatched: 0,
            skipped: 0,
            reconciliationRequired: 0,
            failed: 0,
          };
        });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runDeliveryDispatcherWorker(controller.signal, 10);

      expect(mocks.dispatchPendingDeliveries).toHaveBeenCalledTimes(2);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Delivery Reconciliation Worker', () => {
    it('runs a reconciliation cycle and stops when aborted', async () => {
      const controller = new AbortController();

      mocks.reconcileEventDeliveries.mockImplementationOnce(async () => {
        controller.abort();

        return {
          inspected: 1,
          recovered: 1,
          markedFailed: 0,
          completedJobsRemoved: 0,
          skipped: 0,
          errors: 0,
        };
      });

      await runDeliveryReconciliationWorker(controller.signal, 10);

      expect(mocks.reconcileEventDeliveries).toHaveBeenCalledTimes(1);
    });

    it('does not run when already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      await runDeliveryReconciliationWorker(controller.signal, 10);

      expect(mocks.reconcileEventDeliveries).not.toHaveBeenCalled();
    });

    it('continues after a reconciliation error and stops on abort', async () => {
      const controller = new AbortController();

      mocks.reconcileEventDeliveries
        .mockRejectedValueOnce(new Error('Database unavailable'))
        .mockImplementationOnce(async () => {
          controller.abort();

          return {
            inspected: 0,
            recovered: 0,
            markedFailed: 0,
            completedJobsRemoved: 0,
            skipped: 0,
            errors: 0,
          };
        });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runDeliveryReconciliationWorker(controller.signal, 10);

      expect(mocks.reconcileEventDeliveries).toHaveBeenCalledTimes(2);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });
});
