import type { EventName } from '../contracts/event-types.js';

import type { EventSubscriber } from './event-subscriber.js';

type RegisteredSubscriber = {
  [TName in EventName]: EventSubscriber<TName>;
}[EventName];

/**
 * Manages event subscribers and their event subscriptions.
 */
export class SubscriberRegistry {
  private readonly subscribers = new Map<EventName, Map<string, RegisteredSubscriber>>();

  private readonly subscriberIds = new Set<string>();

  register<TName extends EventName>(subscriber: EventSubscriber<TName>): void {
    if (this.subscriberIds.has(subscriber.id)) {
      throw new Error(`Subscriber "${subscriber.id}" is already registered.`);
    }

    let eventSubscribers = this.subscribers.get(subscriber.eventName);

    if (!eventSubscribers) {
      eventSubscribers = new Map<string, RegisteredSubscriber>();
      this.subscribers.set(subscriber.eventName, eventSubscribers);
    }

    eventSubscribers.set(subscriber.id, subscriber as RegisteredSubscriber);
    this.subscriberIds.add(subscriber.id);
  }

  getSubscribers<TName extends EventName>(eventName: TName): readonly EventSubscriber<TName>[] {
    const eventSubscribers = this.subscribers.get(eventName);

    if (!eventSubscribers) {
      return [];
    }

    return Array.from(eventSubscribers.values()) as EventSubscriber<TName>[];
  }

  hasSubscribers(eventName: EventName): boolean {
    return (this.subscribers.get(eventName)?.size ?? 0) > 0;
  }

  getSubscriber<TName extends EventName>(eventName: TName, subscriberId: string): EventSubscriber<TName> | undefined {
    const eventSubscribers = this.subscribers.get(eventName);

    return eventSubscribers?.get(subscriberId) as EventSubscriber<TName> | undefined;
  }
}
