import type { EventName } from '../contracts/event-types.js';

import { prisma } from '../../db/client.js';
import { createEventDeliveries } from '../deliveries/index.js';
import { eventRegistry } from '../registry/index.js';

const OUTBOX_BATCH_SIZE = 50;

interface ClaimedOutboxEvent {
  id: string;
  eventId: string;
  eventName: string;
  eventVersion: number;
}

export interface PublishOutboxResult {
  published: number;
  failed: number;
}

/**
 * Finds pending outbox events, creates their subscriber deliveries,
 * and marks the events as published in one database transaction.
 */
export async function publishPendingOutboxEvents(): Promise<PublishOutboxResult> {
  return prisma.$transaction(
    async (tx) => {
      const events = await tx.$queryRaw<ClaimedOutboxEvent[]>`
      SELECT
        "id",
        "eventId",
        "eventName",
        "eventVersion"
      FROM "outbox_events"
      WHERE "status" = 'PENDING'::"outbox_event_status"
        AND "availableAt" <= NOW()
      ORDER BY "createdAt" ASC
      LIMIT ${OUTBOX_BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `;

      let published = 0;
      let failed = 0;

      for (const event of events) {
        const definition = eventRegistry.get(event.eventName as EventName, event.eventVersion);

        if (!definition) {
          await tx.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'FAILED',
              attempts: { increment: 1 },
              lastError: `Event "${event.eventName}" version ${event.eventVersion} is not registered.`,
            },
          });

          failed++;
          continue;
        }

        await createEventDeliveries(tx, event.eventId, definition.name);

        await tx.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'PUBLISHED',
            attempts: { increment: 1 },
            publishedAt: new Date(),
            lockedAt: null,
            lastError: null,
          },
        });

        published++;
      }

      return { published, failed };
    },
    {
      maxWait: 5000,
      timeout: 10000,
    },
  );
}
