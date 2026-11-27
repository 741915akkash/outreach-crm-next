import { describe, expect, it } from 'vitest';

import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';

describe('createEvent', () => {
  const baseInput = {
    eventName: EVENT_NAMES.COMPANY_DELETED,
    workspaceId: 'workspace-123',
    entityChanged: {
      type: 'COMPANY',
      id: '123',
    },
    actor: {
      type: 'USER' as const,
      id: 'user-123',
    },
    operationId: 'operation-123',
    payload: {
      id: 123,
      name: 'Acme Technologies',
    },
  };

  it('creates a valid domain event', () => {
    const event = createEvent(baseInput);

    expect(event.eventName).toBe(EVENT_NAMES.COMPANY_DELETED);
    expect(event.eventVersion).toBe(1);
    expect(event.workspaceId).toBe('workspace-123');
    expect(event.entityChanged).toEqual({
      type: 'COMPANY',
      id: '123',
    });
    expect(event.actor).toEqual({
      type: 'USER',
      id: 'user-123',
    });
    expect(event.operationId).toBe('operation-123');
    expect(event.payload).toEqual({
      id: 123,
      name: 'Acme Technologies',
    });
  });

  it('generates a valid UUID for the event', () => {
    const event = createEvent(baseInput);

    expect(event.eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('generates a valid ISO timestamp', () => {
    const event = createEvent(baseInput);

    expect(new Date(event.occurredAt).toISOString()).toBe(event.occurredAt);
  });

  it('includes optional requestId when provided', () => {
    const event = createEvent({
      ...baseInput,
      requestId: 'request-123',
    });

    expect(event.requestId).toBe('request-123');
  });

  it('includes optional triggeredBy when provided', () => {
    const event = createEvent({
      ...baseInput,
      triggeredBy: 'event-123',
    });

    expect(event.triggeredBy).toBe('event-123');
  });

  it('omits optional metadata when not provided', () => {
    const event = createEvent(baseInput);

    expect(event).not.toHaveProperty('requestId');
    expect(event).not.toHaveProperty('triggeredBy');
  });

  it('rejects an invalid payload', () => {
    expect(() =>
      createEvent({
        ...baseInput,
        payload: {
          id: 'invalid-id',
          name: 'Acme Technologies',
        },
      } as never),
    ).toThrow(/Invalid payload for event/);
  });

  it('generates a unique event ID for each event', () => {
    const firstEvent = createEvent(baseInput);
    const secondEvent = createEvent(baseInput);

    expect(firstEvent.eventId).not.toBe(secondEvent.eventId);
  });
});
