import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { processEventDelivery } from '@server/shared/events/processor/index.js';
import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

import { createTestOutboxEvent, createTestWorkspace } from '../../setup/outbox-fixtures.js';

const subscriberId = 'vitest-delivery-heartbeat-subscriber';

let subscriberHandler: () => Promise<void> = async () => {};

const testSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_DELETED> = {
  id: subscriberId,
  eventName: EVENT_NAMES.COMPANY_DELETED,
  handler: async () => subscriberHandler(),
};

describe('Delivery Heartbeat', () => {
  let workspaceId: string;

  beforeAll(() => {
    subscriberRegistry.register(testSubscriber);
  });

  beforeEach(async () => {
    const workspace = await createTestWorkspace();
    workspaceId = workspace.id;
    subscriberHandler = async () => {};
  });

  afterEach(async () => {
    vi.useRealTimers();

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
  });

  async function createDelivery() {
    const event = await createTestOutboxEvent(workspaceId);

    return prisma.eventDelivery.create({
      data: {
        eventId: event.eventId,
        subscriberId,
      },
    });
  }

  function process(deliveryId: string) {
    return processEventDelivery({
      deliveryId,
      bullmqJobId: `delivery-${deliveryId}`,
      executionType: 'NORMAL_RETRY',
      isFinalAttempt: false,
    });
  }

  it('renews the delivery lease while the subscriber is running', async () => {
    const delivery = await createDelivery();

    let releaseHandler!: () => void;
    let notifyHandlerStarted!: () => void;

    const handlerGate = new Promise<void>((resolve) => {
      releaseHandler = resolve;
    });

    const handlerStarted = new Promise<void>((resolve) => {
      notifyHandlerStarted = resolve;
    });

    subscriberHandler = async () => {
      notifyHandlerStarted();
      await handlerGate;
    };

    const execution = process(delivery.id);

    await handlerStarted;

    const initialDelivery = await prisma.eventDelivery.findUniqueOrThrow({
      where: { id: delivery.id },
    });

    const initialLockedAt = initialDelivery.lockedAt;

    expect(initialDelivery.status).toBe('PROCESSING');
    expect(initialLockedAt).not.toBeNull();

    await vi.waitFor(
      async () => {
        const renewedDelivery = await prisma.eventDelivery.findUniqueOrThrow({
          where: { id: delivery.id },
        });

        expect(renewedDelivery.lockedAt!.getTime()).toBeGreaterThan(initialLockedAt!.getTime());
      },
      {
        interval: 100,
        timeout: 25_000,
      },
    );

    releaseHandler();

    await execution;

    const completedDelivery = await prisma.eventDelivery.findUniqueOrThrow({
      where: { id: delivery.id },
    });

    expect(completedDelivery.status).toBe('SUCCEEDED');
    expect(completedDelivery.lockedAt).toBeNull();
  }, 30_000);

  it('does not complete a delivery after heartbeat detects lost ownership', async () => {
    const delivery = await createDelivery();

    let releaseHandler!: () => void;
    let notifyHandlerStarted!: () => void;

    const handlerGate = new Promise<void>((resolve) => {
      releaseHandler = resolve;
    });

    const handlerStarted = new Promise<void>((resolve) => {
      notifyHandlerStarted = resolve;
    });

    subscriberHandler = async () => {
      notifyHandlerStarted();
      await handlerGate;
    };

    const execution = process(delivery.id);

    await handlerStarted;

    await prisma.eventDelivery.update({
      where: { id: delivery.id },
      data: {
        lockToken: 'replacement-owner-token',
      },
    });

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Wait for the heartbeat to detect the changed lock token.
    await vi.waitFor(
      async () => {
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('Lost ownership of delivery'));
      },
      {
        interval: 100,
        timeout: 25_000,
      },
    );

    releaseHandler();

    await expect(execution).rejects.toThrow('ownership was lost during subscriber execution');

    const updatedDelivery = await prisma.eventDelivery.findUniqueOrThrow({
      where: { id: delivery.id },
    });

    expect(updatedDelivery.status).toBe('PROCESSING');
    expect(updatedDelivery.lockToken).toBe('replacement-owner-token');

    consoleWarn.mockRestore();
  }, 30_000);

  it('stops renewing the lease after subscriber execution finishes', async () => {
    const delivery = await createDelivery();

    subscriberHandler = async () => {};

    await process(delivery.id);

    const completedDelivery = await prisma.eventDelivery.findUniqueOrThrow({
      where: { id: delivery.id },
    });

    expect(completedDelivery.status).toBe('SUCCEEDED');
    expect(completedDelivery.lockedAt).toBeNull();
    expect(completedDelivery.lockToken).toBeNull();
  });
});
