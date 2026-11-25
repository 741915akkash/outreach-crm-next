import type { DomainEvent, EventName } from '../contracts/event-types.js';

/**
 * Defines a consumer that handles a specific domain event.
 */
export interface EventSubscriber<TName extends EventName = EventName> {
  id: string;
  eventName: TName;
  handler(event: DomainEvent<TName>): Promise<void>;
}
