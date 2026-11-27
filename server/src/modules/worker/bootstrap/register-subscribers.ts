import { registerCompanySubscribers } from '@server/modules/company/subscribers/index.js';
import { registerLeadSubscribers } from '@server/modules/lead/subscribers/index.js';
import { registerDealSubscribers } from '@server/modules/deal/subscribers/index.js';
import { registerTaskSubscribers } from '@server/modules/task/subscribers/index.js';

/**
 * Registers all application event subscribers.
 */
export function registerSubscribers(): void {
  registerCompanySubscribers();
  registerLeadSubscribers();
  registerDealSubscribers();
  registerTaskSubscribers();
}
