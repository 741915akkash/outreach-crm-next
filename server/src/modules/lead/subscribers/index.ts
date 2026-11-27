import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';

import { leadCreatedSubscriber } from './lead-created.subscriber.js';
import { leadUpdatedSubscriber } from './lead-updated.subscriber.js';
import { leadDeletedSubscriber } from './lead-deleted.subscriber.js';

export { leadCreatedSubscriber, leadUpdatedSubscriber, leadDeletedSubscriber };

/**
 * Registers lead module event subscribers.
 */
export function registerLeadSubscribers(): void {
  subscriberRegistry.register(leadCreatedSubscriber);
  subscriberRegistry.register(leadUpdatedSubscriber);
  subscriberRegistry.register(leadDeletedSubscriber);
}
