import { describe, expect, it, vi } from 'vitest';

import { SubscriberRegistry } from '@server/shared/events/subscribers/subscriber-registry.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

describe('SubscriberRegistry', () => {
  const createSubscriber = (id: string): EventSubscriber<typeof EVENT_NAMES.COMPANY_CREATED> => ({
    id,
    eventName: EVENT_NAMES.COMPANY_CREATED,
    handler: vi.fn().mockResolvedValue(undefined),
  });

  it('registers a subscriber', () => {
    const registry = new SubscriberRegistry();
    const subscriber = createSubscriber('company-created-activity');

    registry.register(subscriber);

    expect(registry.getSubscriber(EVENT_NAMES.COMPANY_CREATED, subscriber.id)).toBe(subscriber);
  });

  it('returns subscribers registered for an event', () => {
    const registry = new SubscriberRegistry();
    const subscriber = createSubscriber('company-created-activity');

    registry.register(subscriber);

    expect(registry.getSubscribers(EVENT_NAMES.COMPANY_CREATED)).toEqual([subscriber]);
  });

  it('allows multiple subscribers for the same event', () => {
    const registry = new SubscriberRegistry();

    const firstSubscriber = createSubscriber('company-created-activity');
    const secondSubscriber = createSubscriber('company-created-webhook');

    registry.register(firstSubscriber);
    registry.register(secondSubscriber);

    expect(registry.getSubscribers(EVENT_NAMES.COMPANY_CREATED)).toEqual([firstSubscriber, secondSubscriber]);
  });

  it('rejects duplicate subscriber IDs', () => {
    const registry = new SubscriberRegistry();

    registry.register(createSubscriber('company-created-activity'));

    expect(() => {
      registry.register(createSubscriber('company-created-activity'));
    }).toThrow('Subscriber "company-created-activity" is already registered.');
  });

  it('rejects duplicate subscriber IDs across different events', () => {
    const registry = new SubscriberRegistry();

    registry.register(createSubscriber('shared-subscriber-id'));

    const anotherSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_DELETED> = {
      id: 'shared-subscriber-id',
      eventName: EVENT_NAMES.COMPANY_DELETED,
      handler: vi.fn().mockResolvedValue(undefined),
    };

    expect(() => {
      registry.register(anotherSubscriber);
    }).toThrow('Subscriber "shared-subscriber-id" is already registered.');
  });

  it('returns an empty array when an event has no subscribers', () => {
    const registry = new SubscriberRegistry();

    expect(registry.getSubscribers(EVENT_NAMES.COMPANY_CREATED)).toEqual([]);
  });

  it('returns undefined when a subscriber does not exist', () => {
    const registry = new SubscriberRegistry();

    expect(registry.getSubscriber(EVENT_NAMES.COMPANY_CREATED, 'unknown-subscriber')).toBeUndefined();
  });

  it('reports whether an event has subscribers', () => {
    const registry = new SubscriberRegistry();

    expect(registry.hasSubscribers(EVENT_NAMES.COMPANY_CREATED)).toBe(false);

    registry.register(createSubscriber('company-created-activity'));

    expect(registry.hasSubscribers(EVENT_NAMES.COMPANY_CREATED)).toBe(true);
  });

  it('does not return subscribers registered for another event', () => {
    const registry = new SubscriberRegistry();

    const subscriber = createSubscriber('company-created-activity');

    registry.register(subscriber);

    expect(registry.getSubscribers(EVENT_NAMES.COMPANY_DELETED)).toEqual([]);
  });
});
