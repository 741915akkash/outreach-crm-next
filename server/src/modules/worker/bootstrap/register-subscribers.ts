import { registerCompanySubscribers } from '@server/modules/company/subscribers/index.js';

/**
 * Registers all application event subscribers.
 */
export function registerSubscribers(): void {
  registerCompanySubscribers();
}
