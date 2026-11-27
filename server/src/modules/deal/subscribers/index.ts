import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';

import { dealCreatedSubscriber } from './deal-created.subscriber.js';
import { dealUpdatedSubscriber } from './deal-updated.subscriber.js';
import { dealDeletedSubscriber } from './deal-deleted.subscriber.js';
import { dealStageChangedSubscriber } from './deal-stage-changed.subscriber.js';

export { dealCreatedSubscriber, dealUpdatedSubscriber, dealDeletedSubscriber, dealStageChangedSubscriber };

/**
 * Registers deal module event subscribers.
 */
export function registerDealSubscribers(): void {
  subscriberRegistry.register(dealCreatedSubscriber);
  subscriberRegistry.register(dealUpdatedSubscriber);
  subscriberRegistry.register(dealDeletedSubscriber);
  subscriberRegistry.register(dealStageChangedSubscriber);
}
