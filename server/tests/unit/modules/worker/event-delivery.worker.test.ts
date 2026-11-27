import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  processor: undefined as unknown as (job: any) => Promise<void>,
  options: undefined as any,
  processEventDelivery: vi.fn(),
}));

vi.mock('bullmq', () => ({
  Queue: class {
    constructor() {}
  },

  Worker: class {
    on = vi.fn();

    constructor(_queueName: string, processor: (job: any) => Promise<void>, options: any) {
      mocks.processor = processor;
      mocks.options = options;
    }
  },
}));

vi.mock('@server/shared/queue/index.js', () => ({
  redisConnection: {},
}));

vi.mock('@server/shared/events/processor/index.js', () => ({
  processEventDelivery: mocks.processEventDelivery,
}));

import { EVENT_DELIVERY_QUEUE_NAME } from '@server/shared/events/queue/index.js';

import { eventDeliveryWorker } from '@server/modules/worker/event-delivery.worker.js';

describe('Event Delivery Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the worker with the correct queue and concurrency settings', () => {
    expect(eventDeliveryWorker).toBeDefined();

    expect(mocks.options).toMatchObject({
      concurrency: 10,
      lockDuration: 30_000,
      stalledInterval: 30_000,
      maxStalledCount: 1,
    });

    expect(EVENT_DELIVERY_QUEUE_NAME).toBe('crm-event-deliveries');
  });

  it('passes delivery information to the processor', async () => {
    await mocks.processor({
      id: 'delivery-job-123',
      data: {
        deliveryId: 'delivery-123',
      },
      opts: {
        attempts: 5,
      },
      attemptsMade: 0,
    });

    expect(mocks.processEventDelivery).toHaveBeenCalledWith({
      deliveryId: 'delivery-123',
      bullmqJobId: 'delivery-job-123',
      executionType: null,
      isFinalAttempt: false,
    });
  });

  it('identifies the final attempt correctly', async () => {
    await mocks.processor({
      id: 'delivery-job-456',
      data: {
        deliveryId: 'delivery-456',
      },
      opts: {
        attempts: 5,
      },
      attemptsMade: 4,
    });

    expect(mocks.processEventDelivery).toHaveBeenCalledWith({
      deliveryId: 'delivery-456',
      bullmqJobId: 'delivery-job-456',
      executionType: null,
      isFinalAttempt: true,
    });
  });

  it('uses one attempt when BullMQ attempts is not configured', async () => {
    await mocks.processor({
      id: 'delivery-job-789',
      data: {
        deliveryId: 'delivery-789',
      },
      opts: {},
      attemptsMade: 0,
    });

    expect(mocks.processEventDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        isFinalAttempt: true,
      }),
    );
  });

  it('propagates processor errors to BullMQ', async () => {
    mocks.processEventDelivery.mockRejectedValueOnce(new Error('Subscriber failed'));

    await expect(
      mocks.processor({
        id: 'delivery-job-error',
        data: {
          deliveryId: 'delivery-error',
        },
        opts: {
          attempts: 5,
        },
        attemptsMade: 0,
      }),
    ).rejects.toThrow('Subscriber failed');
  });
});
