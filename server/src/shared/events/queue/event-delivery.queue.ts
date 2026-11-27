import { Queue } from 'bullmq';

import { redisConnection } from '@server/shared/queue/index.js';

export const EVENT_DELIVERY_QUEUE_NAME = 'crm-event-deliveries';

export interface EventDeliveryJob {
  deliveryId: string;
}

export const eventDeliveryQueue = new Queue<EventDeliveryJob>(EVENT_DELIVERY_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 10000,
    },
    removeOnFail: false,
  },
});
