import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';

import { companyCreatedSubscriber } from './company-created.subscriber.js';

export { companyCreatedSubscriber } from './company-created.subscriber.js';

/**
 * Registers company module event subscribers.
 */
export function registerCompanySubscribers(): void {
  subscriberRegistry.register(companyCreatedSubscriber);
}
