import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';

import { companyCreatedSubscriber } from './company-created.subscriber.js';
import { companyUpdatedSubscriber } from './company-updated.subscriber.js';
import { companyDeletedSubscriber } from './company-deleted.subscriber.js';

export { companyCreatedSubscriber, companyUpdatedSubscriber, companyDeletedSubscriber };

/**
 * Registers company module event subscribers.
 */
export function registerCompanySubscribers(): void {
  subscriberRegistry.register(companyCreatedSubscriber);
  subscriberRegistry.register(companyUpdatedSubscriber);
  subscriberRegistry.register(companyDeletedSubscriber);
}
