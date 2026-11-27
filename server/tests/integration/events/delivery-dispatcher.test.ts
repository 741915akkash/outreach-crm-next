import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@server/shared/db/client.js';
import { eventDeliveryQueue } from '@server/shared/events/queue/index.js';
import { dispatchPendingDeliveries } from '@server/shared/events/dispatcher/index.js';

import { createTestOutboxEvent, createTestWorkspace } from '../../setup/outbox-fixtures.js';

describe('Delivery Dispatcher', () => {
  let workspaceId: string;

  beforeEach(async () => {
    const workspace = await createTestWorkspace();
    workspaceId = workspace.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
  });

  async function createDelivery(availableAt?: Date) {
    const event = await createTestOutboxEvent(workspaceId);

    return prisma.eventDelivery.create({
      data: {
        eventId: event.eventId,
        subscriberId: 'vitest-dispatcher-subscriber',
        ...(availableAt ? { availableAt } : {}),
      },
    });
  }

  it('enqueues pending deliveries with deterministic job IDs', async () => {
    const delivery = await createDelivery();

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue(undefined);
    const addSpy = vi.spyOn(eventDeliveryQueue, 'add').mockResolvedValue(undefined as never);

    const result = await dispatchPendingDeliveries();

    expect(result).toEqual({
      dispatched: 1,
      skipped: 0,
      reconciliationRequired: 0,
      failed: 0,
    });

    expect(addSpy).toHaveBeenCalledWith(
      'process-event-delivery',
      { deliveryId: delivery.id },
      { jobId: `delivery-${delivery.id}` },
    );
  });

  it('skips deliveries that already have active BullMQ jobs', async () => {
    await createDelivery();

    const getState = vi.fn().mockResolvedValue('active');

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue({
      getState,
    } as never);

    const addSpy = vi.spyOn(eventDeliveryQueue, 'add');

    const result = await dispatchPendingDeliveries();

    expect(result.skipped).toBe(1);
    expect(result.dispatched).toBe(0);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('requests reconciliation when an existing job is in a terminal state', async () => {
    await createDelivery();

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue({
      getState: vi.fn().mockResolvedValue('completed'),
    } as never);

    const result = await dispatchPendingDeliveries();

    expect(result).toEqual({
      dispatched: 0,
      skipped: 0,
      reconciliationRequired: 1,
      failed: 0,
    });
  });

  it('records enqueue failures without stopping the batch', async () => {
    const firstDelivery = await createDelivery();
    const secondDelivery = await createDelivery();

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue(undefined);

    const addSpy = vi
      .spyOn(eventDeliveryQueue, 'add')
      .mockRejectedValueOnce(new Error('Redis unavailable'))
      .mockResolvedValueOnce(undefined as never);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await dispatchPendingDeliveries();

    expect(result).toEqual({
      dispatched: 1,
      skipped: 0,
      reconciliationRequired: 0,
      failed: 1,
    });

    expect(addSpy).toHaveBeenCalledTimes(2);
    expect(addSpy).toHaveBeenNthCalledWith(
      1,
      'process-event-delivery',
      { deliveryId: firstDelivery.id },
      { jobId: `delivery-${firstDelivery.id}` },
    );
    expect(addSpy).toHaveBeenNthCalledWith(
      2,
      'process-event-delivery',
      { deliveryId: secondDelivery.id },
      { jobId: `delivery-${secondDelivery.id}` },
    );

    consoleError.mockRestore();
  });

  it('does not dispatch deliveries scheduled for the future', async () => {
    await createDelivery(new Date(Date.now() + 60_000));

    const getJobSpy = vi.spyOn(eventDeliveryQueue, 'getJob');
    const addSpy = vi.spyOn(eventDeliveryQueue, 'add');

    const result = await dispatchPendingDeliveries();

    expect(result.dispatched).toBe(0);
    expect(result.failed).toBe(0);
    expect(getJobSpy).not.toHaveBeenCalled();
    expect(addSpy).not.toHaveBeenCalled();
  });
});
