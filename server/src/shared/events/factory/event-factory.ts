import { randomUUID } from 'node:crypto';

import type { Actor } from '../../context/actor.js';
import type { DomainEvent, EventName, EventPayloadMap } from '../contracts/event-types.js';

import { eventRegistry } from '../registry/index.js';

export interface CreateEventInput<TName extends EventName> {
  eventName: TName;
  workspaceId: string;
  entityChanged: {
    type: string;
    id: string;
  };
  actor: Actor;
  operationId: string;
  requestId?: string;
  triggeredBy?: string;
  payload: EventPayloadMap[TName];
}

/**
 * Creates a validated domain event with its common metadata.
 */
export function createEvent<TName extends EventName>(input: CreateEventInput<TName>): DomainEvent<TName> {
  const definition = eventRegistry.get(input.eventName, 1);

  if (!definition) {
    throw new Error(`Event "${input.eventName}" version 1 is not registered.`);
  }

  const validation = eventRegistry.validate(input.eventName, definition.version, input.payload);

  if (!validation.success) {
    throw new Error(`Invalid payload for event "${input.eventName}": ${validation.error.message}`);
  }

  return {
    eventId: randomUUID(),
    eventName: input.eventName,
    eventVersion: definition.version,
    workspaceId: input.workspaceId,
    entityChanged: input.entityChanged,
    actor: input.actor,
    occurredAt: new Date().toISOString(),
    operationId: input.operationId,
    ...(input.requestId ? { requestId: input.requestId } : {}),
    ...(input.triggeredBy ? { triggeredBy: input.triggeredBy } : {}),
    payload: validation.data as EventPayloadMap[TName],
  };
}
