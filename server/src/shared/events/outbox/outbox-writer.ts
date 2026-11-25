import type { Prisma } from '@/generated/prisma/client.js';

import type { DomainEvent, EventName } from '../contracts/event-types.js';

export async function writeOutboxEvent<TName extends EventName>(
  tx: Prisma.TransactionClient,
  event: DomainEvent<TName>,
) {
  return tx.outboxEvent.create({
    data: {
      eventId: event.eventId,
      workspaceId: event.workspaceId,
      eventName: event.eventName,
      eventVersion: event.eventVersion,

      entityChangedType: event.entityChanged.type,
      entityChangedId: event.entityChanged.id,

      actorType: event.actor.type,
      actorId: event.actor.id,

      operationId: event.operationId,
      requestId: event.requestId ?? null,
      triggeredBy: event.triggeredBy ?? null,

      payload: event.payload as unknown as Prisma.InputJsonValue,

      occurredAt: new Date(event.occurredAt),
    },
  });
}
