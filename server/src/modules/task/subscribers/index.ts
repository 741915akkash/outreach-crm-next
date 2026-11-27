import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';

import { taskCreatedSubscriber } from './task-created.subscriber.js';
import { taskUpdatedSubscriber } from './task-updated.subscriber.js';
import { taskDeletedSubscriber } from './task-deleted.subscriber.js';
import { taskCompletedSubscriber } from './task-completed.subscriber.js';

export { taskCreatedSubscriber, taskUpdatedSubscriber, taskDeletedSubscriber, taskCompletedSubscriber };

/**
 * Registers task module event subscribers.
 */
export function registerTaskSubscribers(): void {
  subscriberRegistry.register(taskCreatedSubscriber);
  subscriberRegistry.register(taskUpdatedSubscriber);
  subscriberRegistry.register(taskDeletedSubscriber);
  subscriberRegistry.register(taskCompletedSubscriber);
}

