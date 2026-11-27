import { prisma } from '@server/shared/db/client.js';
import { eventDeliveryQueue } from '../queue/index.js';

const RECONCILIATION_BATCH_SIZE = 50;
const PROCESSING_STALE_AFTER_MS = 90_000;

interface ProcessingDelivery {
  id: string;
  lockToken: string | null;
}

interface ReconciliationResult {
  inspected: number;
  recovered: number;
  markedFailed: number;
  completedJobsRemoved: number;
  skipped: number;
  errors: number;
}

/**
 * Recovers a stale PROCESSING delivery.
 *
 * The conditional update protects against changing a delivery
 * that has been claimed by another execution in the meantime.
 */
async function recoverProcessingDelivery(
  delivery: ProcessingDelivery,
  staleBefore: Date,
  reason: string,
): Promise<boolean> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const result = await tx.eventDelivery.updateMany({
      where: {
        id: delivery.id,
        status: 'PROCESSING',
        lockedAt: {
          lte: staleBefore,
        },
        lockToken: delivery.lockToken,
      },
      data: {
        status: 'PENDING',
        availableAt: now,
        lockedAt: null,
        lockToken: null,
        completedAt: null,
        lastError: reason,
      },
    });

    if (result.count !== 1) {
      return false;
    }

    const processingAttempts = await tx.eventDeliveryAttempt.findMany({
      where: {
        deliveryId: delivery.id,
        status: 'PROCESSING',
      },
      select: {
        id: true,
        startedAt: true,
      },
    });

    for (const attempt of processingAttempts) {
      await tx.eventDeliveryAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: 'FAILED',
          completedAt: now,
          durationMs: now.getTime() - attempt.startedAt.getTime(),
          errorMessage: reason,
        },
      });
    }

    return true;
  });
}

/**
 * Marks a delivery as terminally failed.
 *
 * Any unfinished PostgreSQL attempt is also closed.
 */
async function markDeliveryFailed(
  deliveryId: string,
  reason: string,
  staleBefore?: Date,
  lockToken?: string | null,
): Promise<boolean> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const result = await tx.eventDelivery.updateMany({
      where: {
        id: deliveryId,
        status: staleBefore ? 'PROCESSING' : 'PENDING',
        ...(staleBefore
          ? {
              lockedAt: { lte: staleBefore },
              lockToken,
            }
          : {}),
      },
      data: {
        status: 'FAILED',
        completedAt: now,
        lockedAt: null,
        lockToken: null,
        lastError: reason,
      },
    });

    if (result.count !== 1) {
      return false;
    }

    const processingAttempts = await tx.eventDeliveryAttempt.findMany({
      where: {
        deliveryId,
        status: 'PROCESSING',
      },
      select: {
        id: true,
        startedAt: true,
      },
    });

    for (const attempt of processingAttempts) {
      await tx.eventDeliveryAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: 'FAILED',
          completedAt: now,
          durationMs: now.getTime() - attempt.startedAt.getTime(),
          errorMessage: reason,
        },
      });
    }

    return true;
  });
}

/**
 * Reconciles stale PROCESSING deliveries.
 */
async function reconcileProcessingDeliveries(staleBefore: Date, result: ReconciliationResult): Promise<void> {
  const deliveries = await prisma.eventDelivery.findMany({
    where: {
      status: 'PROCESSING',
      lockedAt: {
        lte: staleBefore,
      },
    },
    select: {
      id: true,
      lockToken: true,
    },
    orderBy: {
      lockedAt: 'asc',
    },
    take: RECONCILIATION_BATCH_SIZE,
  });

  for (const delivery of deliveries) {
    result.inspected++;

    try {
      const jobId = `delivery-${delivery.id}`;
      const job = await eventDeliveryQueue.getJob(jobId);

      if (!job) {
        const recovered = await recoverProcessingDelivery(
          delivery,
          staleBefore,
          'BullMQ job was missing during reconciliation.',
        );

        if (recovered) {
          result.recovered++;
        } else {
          result.skipped++;
        }

        continue;
      }

      const state = await job.getState();

      if (state === 'failed') {
        const reason = job.failedReason || 'BullMQ job exhausted its retry or stalled-job recovery limit.';

        const markedFailed = await markDeliveryFailed(delivery.id, reason, staleBefore, delivery.lockToken);

        if (markedFailed) {
          result.markedFailed++;
        } else {
          result.skipped++;
        }

        continue;
      }

      if (state === 'completed') {
        const recovered = await recoverProcessingDelivery(
          delivery,
          staleBefore,
          'BullMQ job completed but PostgreSQL delivery remained PROCESSING.',
        );

        if (recovered) {
          result.recovered++;

          await job.remove();
          result.completedJobsRemoved++;
        } else {
          result.skipped++;
        }

        continue;
      }

      // Active, waiting, delayed, and other non-terminal states
      // are left to BullMQ.
      result.skipped++;
    } catch (error) {
      result.errors++;

      console.error(`[Event Reconciliation] Failed to reconcile delivery ${delivery.id}:`, error);
    }
  }
}

/**
 * Reconciles PENDING deliveries that have terminal BullMQ jobs.
 */
async function reconcilePendingDeliveries(result: ReconciliationResult): Promise<void> {
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
      updatedAt: 'asc',
    },
    take: RECONCILIATION_BATCH_SIZE,
  });

  for (const delivery of deliveries) {
    result.inspected++;

    try {
      const jobId = `delivery-${delivery.id}`;
      const job = await eventDeliveryQueue.getJob(jobId);

      // The dispatcher handles deliveries without an existing job.
      if (!job) {
        result.skipped++;
        continue;
      }

      const state = await job.getState();

      if (state === 'completed') {
        // Remove the terminal job so the dispatcher can enqueue
        // this still-pending delivery again.
        await job.remove();

        result.completedJobsRemoved++;
        continue;
      }

      if (state === 'failed') {
        const reason = job.failedReason || 'BullMQ job failed and is in a terminal state.';

        const markedFailed = await markDeliveryFailed(delivery.id, reason);

        if (markedFailed) {
          result.markedFailed++;
        } else {
          result.skipped++;
        }

        continue;
      }

      result.skipped++;
    } catch (error) {
      result.errors++;

      console.error(`[Event Reconciliation] Failed to reconcile delivery ${delivery.id}:`, error);
    }
  }
}

/**
 * Reconciles PostgreSQL delivery state with BullMQ job state.
 */
export async function reconcileEventDeliveries(): Promise<ReconciliationResult> {
  const staleBefore = new Date(Date.now() - PROCESSING_STALE_AFTER_MS);

  const result: ReconciliationResult = {
    inspected: 0,
    recovered: 0,
    markedFailed: 0,
    completedJobsRemoved: 0,
    skipped: 0,
    errors: 0,
  };

  // Process stale PROCESSING deliveries first so pending deliveries
  // cannot starve their recovery.
  await reconcileProcessingDeliveries(staleBefore, result);

  await reconcilePendingDeliveries(result);

  return result;
}
