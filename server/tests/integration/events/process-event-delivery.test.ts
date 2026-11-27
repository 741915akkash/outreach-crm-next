import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { processEventDelivery } from '@server/shared/events/processor/index.js';
import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

import { createTestOutboxEvent, createTestWorkspace } from '../../setup/outbox-fixtures.js';

const subscriberId = 'vitest-processor-subscriber';

let subscriberHandler: () => Promise<void> = async () => {};

const testSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_DELETED> = {
  id: subscriberId,
  eventName: EVENT_NAMES.COMPANY_DELETED,
  handler: async () => subscriberHandler(),
};

describe('Event Delivery Processor', () => {
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
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
  });

  async function createDelivery(targetSubscriberId = subscriberId) {
    const event = await createTestOutboxEvent(workspaceId);

    const delivery = await prisma.eventDelivery.create({
      data: {
        eventId: event.eventId,
        subscriberId: targetSubscriberId,
      },
    });

    return delivery;
  }

  function process(deliveryId: string, isFinalAttempt = false) {
    return processEventDelivery({
      deliveryId,
      bullmqJobId: `delivery-${deliveryId}`,
      executionType: 'NORMAL_RETRY',
      isFinalAttempt,
    });
  }

  it('claims a pending delivery and marks it SUCCEEDED', async () => {
    const delivery = await createDelivery();

    const handler = vi.fn(async () => {});
    subscriberHandler = handler;

    await process(delivery.id);

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
      include: { deliveryAttempts: true },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(updatedDelivery?.status).toBe('SUCCEEDED');
    expect(updatedDelivery?.attempts).toBe(1);
    expect(updatedDelivery?.lockedAt).toBeNull();
    expect(updatedDelivery?.lockToken).toBeNull();
    expect(updatedDelivery?.completedAt).not.toBeNull();

    expect(updatedDelivery?.deliveryAttempts).toHaveLength(1);
    expect(updatedDelivery?.deliveryAttempts[0]?.status).toBe('SUCCEEDED');
    expect(updatedDelivery?.deliveryAttempts[0]?.attemptNumber).toBe(1);
    expect(updatedDelivery?.deliveryAttempts[0]?.bullmqJobId).toBe(`delivery-${delivery.id}`);
  });

  it('does not process a delivery that is already completed', async () => {
    const delivery = await createDelivery();

    await prisma.eventDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'SUCCEEDED',
        completedAt: new Date(),
      },
    });

    const handler = vi.fn(async () => {});
    subscriberHandler = handler;

    await process(delivery.id);

    const unchangedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(handler).not.toHaveBeenCalled();
    expect(unchangedDelivery?.attempts).toBe(0);
    expect(unchangedDelivery?.status).toBe('SUCCEEDED');
  });

  it('returns a failed delivery to PENDING when another retry is available', async () => {
    const delivery = await createDelivery();

    subscriberHandler = async () => {
      throw new Error('Temporary subscriber failure');
    };

    await expect(process(delivery.id, false)).rejects.toThrow('Temporary subscriber failure');

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
      include: { deliveryAttempts: true },
    });

    expect(updatedDelivery?.status).toBe('PENDING');
    expect(updatedDelivery?.attempts).toBe(1);
    expect(updatedDelivery?.lockToken).toBeNull();
    expect(updatedDelivery?.lastError).toBe('Temporary subscriber failure');

    expect(updatedDelivery?.deliveryAttempts).toHaveLength(1);
    expect(updatedDelivery?.deliveryAttempts[0]?.status).toBe('FAILED');
    expect(updatedDelivery?.deliveryAttempts[0]?.errorMessage).toBe('Temporary subscriber failure');
  });

  it('marks a delivery FAILED after its final attempt', async () => {
    const delivery = await createDelivery();

    subscriberHandler = async () => {
      throw new Error('Permanent subscriber failure');
    };

    await expect(process(delivery.id, true)).rejects.toThrow('Permanent subscriber failure');

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
      include: { deliveryAttempts: true },
    });

    expect(updatedDelivery?.status).toBe('FAILED');
    expect(updatedDelivery?.completedAt).not.toBeNull();
    expect(updatedDelivery?.lastError).toBe('Permanent subscriber failure');
    expect(updatedDelivery?.deliveryAttempts[0]?.status).toBe('FAILED');
  });

  it('records an error when the subscriber is not registered', async () => {
    const delivery = await createDelivery('missing-subscriber');

    await expect(process(delivery.id, true)).rejects.toThrow('Subscriber "missing-subscriber" is not registered');

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
      include: { deliveryAttempts: true },
    });

    expect(updatedDelivery?.status).toBe('FAILED');
    expect(updatedDelivery?.deliveryAttempts).toHaveLength(1);
    expect(updatedDelivery?.deliveryAttempts[0]?.status).toBe('FAILED');
  });

  it('does not claim a delivery that is scheduled for the future', async () => {
    const delivery = await createDelivery();

    await prisma.eventDelivery.update({
      where: { id: delivery.id },
      data: {
        availableAt: new Date(Date.now() + 60_000),
      },
    });

    const handler = vi.fn(async () => {});
    subscriberHandler = handler;

    await process(delivery.id);

    const unchangedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(handler).not.toHaveBeenCalled();
    expect(unchangedDelivery?.status).toBe('PENDING');
    expect(unchangedDelivery?.attempts).toBe(0);
  });
});
