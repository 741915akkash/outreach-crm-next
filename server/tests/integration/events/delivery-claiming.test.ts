
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { processEventDelivery } from '@server/shared/events/processor/index.js';
import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

import {
  createTestOutboxEvent,
  createTestWorkspace,
} from '../../setup/outbox-fixtures.js';

const subscriberId = 'vitest-delivery-claiming-subscriber';

let subscriberHandler: () => Promise<void> = async () => {};

const testSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_DELETED> = {
  id: subscriberId,
  eventName: EVENT_NAMES.COMPANY_DELETED,
  handler: async () => subscriberHandler(),
};

describe('Delivery Claiming and Ownership', () => {
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

  it('allows only one worker to claim and execute a delivery', async () => {
    const delivery = await createDelivery();

    let releaseHandler!: () => void;
    let notifyHandlerStarted!: () => void;

    const handlerGate = new Promise<void>((resolve) => {
      releaseHandler = resolve;
    });

    const handlerStarted = new Promise<void>((resolve) => {
      notifyHandlerStarted = resolve;
    });

    const handler = vi.fn(async () => {
      notifyHandlerStarted();
      await handlerGate;
    });

    subscriberHandler = handler;

    const firstExecution = process(delivery.id);

    // Wait until the first worker has claimed the delivery.
    await handlerStarted;

    // The second worker should fail to claim it and return.
    await process(delivery.id);

    const duringExecution = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(duringExecution?.status).toBe('PROCESSING');
    expect(duringExecution?.attempts).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);

    releaseHandler();

    await firstExecution;

    const completedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
      include: { deliveryAttempts: true },
    });

    expect(completedDelivery?.status).toBe('SUCCEEDED');
    expect(completedDelivery?.attempts).toBe(1);
    expect(completedDelivery?.deliveryAttempts).toHaveLength(1);
  });

  it('does not allow an old worker to complete a delivery after losing ownership', async () => {
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

    const claimedDelivery = await prisma.eventDelivery.findUniqueOrThrow({
      where: { id: delivery.id },
    });

    expect(claimedDelivery.lockToken).not.toBeNull();

    // Simulate another execution taking ownership.
    await prisma.eventDelivery.update({
      where: { id: delivery.id },
      data: {
        lockToken: 'new-owner-lock-token',
      },
    });

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    releaseHandler();

    await expect(execution).rejects.toThrow(
      'is no longer owned by this worker',
    );

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(updatedDelivery?.status).toBe('PROCESSING');
    expect(updatedDelivery?.lockToken).toBe('new-owner-lock-token');

    consoleWarn.mockRestore();
  });

  it('closes an interrupted previous attempt when a delivery is reclaimed', async () => {
    const delivery = await createDelivery();

    const previousStartedAt = new Date(Date.now() - 5000);

    await prisma.eventDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts: 1,
      },
    });

    const previousAttempt = await prisma.eventDeliveryAttempt.create({
      data: {
        deliveryId: delivery.id,
        attemptNumber: 1,
        status: 'PROCESSING',
        startedAt: previousStartedAt,
        bullmqJobId: 'previous-bullmq-job',
      },
    });

    await process(delivery.id);

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
      include: { deliveryAttempts: true },
    });

    expect(updatedDelivery?.status).toBe('SUCCEEDED');
    expect(updatedDelivery?.attempts).toBe(2);
    expect(updatedDelivery?.deliveryAttempts).toHaveLength(2);

    const interruptedAttempt = updatedDelivery?.deliveryAttempts.find(
      (attempt) => attempt.id === previousAttempt.id,
    );

    const newAttempt = updatedDelivery?.deliveryAttempts.find(
      (attempt) => attempt.attemptNumber === 2,
    );

    expect(interruptedAttempt?.status).toBe('FAILED');
    expect(interruptedAttempt?.errorMessage).toBe(
      'Previous execution was interrupted. Delivery reclaimed.',
    );

    expect(newAttempt?.status).toBe('SUCCEEDED');
    expect(newAttempt?.attemptNumber).toBe(2);
  });
});
