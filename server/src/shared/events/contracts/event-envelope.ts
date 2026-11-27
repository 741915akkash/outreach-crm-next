import type { Actor } from '../../context/actor.js';

/**
 * Represents the common envelope for all domain events.
 *
 * Every event carries metadata about the event itself,
 * the affected entity, the initiating actor, and its payload.
 */
export interface EventEnvelope<TPayload = unknown> {
  eventId: string;
  eventName: string;
  eventVersion: number;
  workspaceId: string;
  entityChanged: {
    type: string;
    id: string;
  };
  actor: Actor;
  occurredAt: string;
  requestId?: string;
  operationId: string;
  triggeredBy?: string;
  payload: TPayload;
}
