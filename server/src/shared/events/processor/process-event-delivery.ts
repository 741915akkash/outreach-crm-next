import { randomUUID } from 'node:crypto';

import { prisma } from '@server/shared/db/client.js';
import type { Actor } from '@server/shared/context/actor.js';

import type { DomainEvent, EventName, EventPayloadMap } from '../contracts/event-types.js';

import { eventRegistry } from '../registry/index.js';
import { subscriberRegistry } from '../subscribers/index.js';

const CLAIM_BATCH_TIMEOUT_MS = 5000;
const DELIVERY_HEARTBEAT_INTERVAL_MS = 20_000;

interface ProcessEventDeliveryInput {
  deliveryId: string;
  bullmqJobId: string | null;
  executionType: 'NORMAL_RETRY' | 'STALLED_RECOVERY' | null;
  isFinalAttempt: boolean;
}

function getErrorDetails(error: unknown): {
  message: string;
  stack: string | null;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    message: String(error),
    stack: null,
  };
}

/**
 * Renews the PostgreSQL delivery lease while a subscriber is executing.
 *
 * Only the current lockToken owner can renew the lease.
 * If ownership is lost, the heartbeat stops.
 */
function startDeliveryHeartbeat(deliveryId: string, lockToken: string) {
  let stopped = false;
  let ownershipLost = false;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let heartbeatInProgress: Promise<void> | undefined;

  function scheduleNextHeartbeat() {
    if (stopped || ownershipLost) {
      return;
    }

    timer = setTimeout(() => {
      heartbeatInProgress = renewLease().finally(() => {
        heartbeatInProgress = undefined;
        scheduleNextHeartbeat();
      });
    }, DELIVERY_HEARTBEAT_INTERVAL_MS);
  }

  async function renewLease(): Promise<void> {
    try {
      const result = await prisma.eventDelivery.updateMany({
        where: {
          id: deliveryId,
          status: 'PROCESSING',
          lockToken,
        },
        data: {
          lockedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        ownershipLost = true;

        console.warn(`[Event Processor] Lost ownership of delivery ${deliveryId}.`);
      }
    } catch (error) {
      console.error(`[Event Processor] Failed to renew lease for delivery ${deliveryId}:`, error);
    }
  }

  scheduleNextHeartbeat();

  return {
    isOwnershipLost(): boolean {
      return ownershipLost;
    },

    async stop(): Promise<void> {
      stopped = true;

      if (timer) {
        clearTimeout(timer);
      }

      await heartbeatInProgress;
    },
  };
}

type ClaimedDelivery = {
  delivery: {
    event: {
      eventId: string;
      workspaceId: string;
      eventName: string;
      eventVersion: number;
      entityChangedType: string;
      entityChangedId: string;
      actorType: string;
      actorId: string;
      operationId: string;
      requestId: string | null;
      triggeredBy: string | null;
      payload: unknown;
      occurredAt: Date;
    };
  };
};

/**
 * Atomically claims a pending delivery or reclaims a delivery
 * whose previous execution was interrupted and redelivered by BullMQ.
 *
 * BullMQ owns execution locking and stalled-job recovery.
 * PostgreSQL lockToken protects delivery state from stale executions.
 */
async function claimDelivery(
  deliveryId: string,
  metadata: {
    bullmqJobId: string | null;
    executionType: 'NORMAL_RETRY' | 'STALLED_RECOVERY' | null;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();
      const lockToken = randomUUID();

      const result = await tx.eventDelivery.updateMany({
        where: {
          id: deliveryId,
          status: 'PENDING',
          availableAt: {
            lte: now,
          },
        },
        data: {
          status: 'PROCESSING',
          lockedAt: now,
          lockToken,
          attempts: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        return null;
      }

      const delivery = await tx.eventDelivery.findUnique({
        where: {
          id: deliveryId,
        },
        include: {
          event: true,
        },
      });

      if (!delivery) {
        throw new Error(`Delivery "${deliveryId}" was not found.`);
      }

      // Close any previous unfinished attempts after a redelivery.
      const previousAttempts = await tx.eventDeliveryAttempt.findMany({
        where: {
          deliveryId,
          status: 'PROCESSING',
        },
        select: {
          id: true,
          startedAt: true,
        },
      });

      for (const previousAttempt of previousAttempts) {
        await tx.eventDeliveryAttempt.update({
          where: {
            id: previousAttempt.id,
          },
          data: {
            status: 'FAILED',
            completedAt: now,
            durationMs: now.getTime() - previousAttempt.startedAt.getTime(),
            errorMessage: 'Previous execution was interrupted. Delivery reclaimed.',
          },
        });
      }

      const attempt = await tx.eventDeliveryAttempt.create({
        data: {
          deliveryId,
          attemptNumber: delivery.attempts,
          status: 'PROCESSING',
          startedAt: now,
          bullmqJobId: metadata.bullmqJobId,
          executionType: metadata.executionType,
        },
      });

      return {
        delivery,
        attempt,
        lockToken,
      };
    },
    {
      maxWait: CLAIM_BATCH_TIMEOUT_MS,
      timeout: 10000,
    },
  );
}

/**
 * Reconstructs and validates a domain event from its persisted outbox record.
 */
function reconstructEvent(record: ClaimedDelivery['delivery']['event']): DomainEvent<EventName> {
  const eventName = record.eventName as EventName;

  const definition = eventRegistry.get(eventName, record.eventVersion);

  if (!definition) {
    throw new Error(`Event "${record.eventName}" version ${record.eventVersion} is not registered.`);
  }

  const validation = eventRegistry.validate(eventName, record.eventVersion, record.payload);

  if (!validation.success) {
    throw new Error(`Invalid payload for event "${record.eventName}": ${validation.error.message}`);
  }

  return {
    eventId: record.eventId,
    eventName,
    eventVersion: record.eventVersion,
    workspaceId: record.workspaceId,
    entityChanged: {
      type: record.entityChangedType,
      id: record.entityChangedId,
    },
    actor: {
      type: record.actorType as Actor['type'],
      id: record.actorId,
    },
    occurredAt: record.occurredAt.toISOString(),
    operationId: record.operationId,
    ...(record.requestId ? { requestId: record.requestId } : {}),
    ...(record.triggeredBy ? { triggeredBy: record.triggeredBy } : {}),
    payload: validation.data as EventPayloadMap[EventName],
  };
}

/**
 * Executes one subscriber delivery and persists its outcome.
 *
 * BullMQ owns retry scheduling.
 * PostgreSQL owns delivery state and attempt history.
 */
export async function processEventDelivery(input: ProcessEventDeliveryInput): Promise<void> {
  const claimed = await claimDelivery(input.deliveryId, {
    bullmqJobId: input.bullmqJobId,
    executionType: input.executionType,
  });

  if (!claimed) {
    return;
  }

  const { delivery, attempt, lockToken } = claimed;
  const startedAt = attempt.startedAt.getTime();

  try {
    const event = reconstructEvent(delivery.event);

    const subscriber = subscriberRegistry.getSubscriber(event.eventName, delivery.subscriberId);

    if (!subscriber) {
      throw new Error(`Subscriber "${delivery.subscriberId}" is not registered for event "${event.eventName}".`);
    }

    const heartbeat = startDeliveryHeartbeat(delivery.id, lockToken);

    try {
      await subscriber.handler(event);
    } finally {
      await heartbeat.stop();
    }

    if (heartbeat.isOwnershipLost()) {
      throw new Error(`Delivery "${delivery.id}" ownership was lost during subscriber execution.`);
    }

    const completedAt = new Date();

    const completed = await prisma.$transaction(async (tx) => {
      const result = await tx.eventDelivery.updateMany({
        where: {
          id: delivery.id,
          status: 'PROCESSING',
          lockToken,
        },
        data: {
          status: 'SUCCEEDED',
          completedAt,
          lockedAt: null,
          lockToken: null,
          lastError: null,
        },
      });

      if (result.count !== 1) {
        return false;
      }

      await tx.eventDeliveryAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: 'SUCCEEDED',
          completedAt,
          durationMs: completedAt.getTime() - startedAt,
        },
      });

      return true;
    });

    if (!completed) {
      throw new Error(`Delivery "${delivery.id}" is no longer owned by this worker.`);
    }
  } catch (error) {
    const completedAt = new Date();
    const details = getErrorDetails(error);

    const ownsDelivery = await prisma.$transaction(async (tx) => {
      const result = await tx.eventDelivery.updateMany({
        where: {
          id: delivery.id,
          status: 'PROCESSING',
          lockToken,
        },
        data: {
          status: input.isFinalAttempt ? 'FAILED' : 'PENDING',
          availableAt: completedAt,
          completedAt: input.isFinalAttempt ? completedAt : null,
          lockedAt: null,
          lockToken: null,
          lastError: details.message,
        },
      });

      if (result.count !== 1) {
        return false;
      }

      await tx.eventDeliveryAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: 'FAILED',
          completedAt,
          durationMs: completedAt.getTime() - startedAt,
          errorMessage: details.message,
          errorStack: details.stack,
        },
      });

      return true;
    });

    if (!ownsDelivery) {
      console.warn(`[Event Processor] Delivery ${delivery.id} is no longer owned by this worker.`);
    }

    // BullMQ must receive the error to schedule its retry.
    throw error;
  }
}
