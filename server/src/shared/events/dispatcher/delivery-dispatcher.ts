import { prisma } from '@server/shared/db/client.js';
import { eventDeliveryQueue } from '../queue/index.js';

const DISPATCH_BATCH_SIZE = 50;

const ACTIVE_JOB_STATES = new Set(['waiting', 'active', 'delayed', 'paused', 'prioritized', 'waiting-children']);

export interface DispatchResult {
  dispatched: number;
  skipped: number;
  reconciliationRequired: number;
  failed: number;
}

export async function dispatchPendingDeliveries(): Promise<DispatchResult> {
  const deliveries = await prisma.eventDelivery.findMany({
    where: {
      status: 'PENDING',
      availableAt: {
        lte: new Date(),
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: DISPATCH_BATCH_SIZE,
  });

  let dispatched = 0;
  let skipped = 0;
  let reconciliationRequired = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    const jobId = `delivery-${delivery.id}`;

    try {
      const existingJob = await eventDeliveryQueue.getJob(jobId);

      if (existingJob) {
        const state = await existingJob.getState();

        if (ACTIVE_JOB_STATES.has(state)) {
          skipped++;
          continue;
        }

        console.warn(
          `[Delivery Dispatcher] Delivery ${delivery.id} has an unexpected or terminal BullMQ job state (${state}). Reconciliation required.`,
        );

        reconciliationRequired++;
        continue;
      }

      await eventDeliveryQueue.add(
        'process-event-delivery',
        {
          deliveryId: delivery.id,
        },
        {
          jobId,
        },
      );

      dispatched++;
    } catch (error) {
      failed++;

      console.error(`[Delivery Dispatcher] Failed to enqueue delivery ${delivery.id}:`, error);
    }
  }

  return {
    dispatched,
    skipped,
    reconciliationRequired,
    failed,
  };
}
