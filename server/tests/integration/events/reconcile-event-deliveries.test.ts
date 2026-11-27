import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@server/shared/db/client.js';
import { eventDeliveryQueue } from '@server/shared/events/queue/index.js';
import { reconcileEventDeliveries } from '@server/shared/events/reconciliation/index.js';

import { clearTestEventData, createTestOutboxEvent, createTestWorkspace } from '../../setup/outbox-fixtures.js';

describe('Event Delivery Reconciliation', () => {
  let workspaceId: string;

  beforeEach(async () => {
    await clearTestEventData();

    const workspace = await createTestWorkspace();
    workspaceId = workspace.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
  });

  async function createDelivery(status: 'PENDING' | 'PROCESSING' = 'PENDING') {
    const event = await createTestOutboxEvent(workspaceId);

    const delivery = await prisma.eventDelivery.create({
      data: {
        eventId: event.eventId,
        subscriberId: 'vitest-reconciliation-subscriber',
        status,
        ...(status === 'PROCESSING'
          ? {
              lockedAt: new Date(Date.now() - 120_000),
              lockToken: 'vitest-lock-token',
            }
          : {}),
      },
    });

    return delivery;
  }

  function mockJob(state: string, options: { failedReason?: string } = {}) {
    return {
      getState: vi.fn().mockResolvedValue(state),
      remove: vi.fn().mockResolvedValue(undefined),
      failedReason: options.failedReason ?? '',
    };
  }

  it('recovers stale PROCESSING deliveries when their BullMQ job is missing', async () => {
    const delivery = await createDelivery('PROCESSING');

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue(undefined);

    const result = await reconcileEventDeliveries();

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(result.recovered).toBe(1);
    expect(updatedDelivery?.status).toBe('PENDING');
    expect(updatedDelivery?.lockedAt).toBeNull();
    expect(updatedDelivery?.lockToken).toBeNull();
    expect(updatedDelivery?.lastError).toBe('BullMQ job was missing during reconciliation.');
  });

  it('marks stale PROCESSING deliveries FAILED when their BullMQ job failed', async () => {
    const delivery = await createDelivery('PROCESSING');

    const job = mockJob('failed', {
      failedReason: 'BullMQ retry limit exhausted',
    });

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue(job as never);

    const result = await reconcileEventDeliveries();

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(result.markedFailed).toBe(1);
    expect(updatedDelivery?.status).toBe('FAILED');
    expect(updatedDelivery?.lastError).toBe('BullMQ retry limit exhausted');
    expect(updatedDelivery?.lockToken).toBeNull();
  });

  it('recovers stale PROCESSING deliveries when the BullMQ job completed', async () => {
    const delivery = await createDelivery('PROCESSING');

    const job = mockJob('completed');

    vi.spyOn(eventDeliveryQueue, 'getJob')
      .mockResolvedValueOnce(job as never)
      .mockResolvedValueOnce(undefined);

    const result = await reconcileEventDeliveries();

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(result.recovered).toBe(1);
    expect(result.completedJobsRemoved).toBe(1);
    expect(updatedDelivery?.status).toBe('PENDING');
    expect(job.remove).toHaveBeenCalledTimes(1);
  });

  it('marks PENDING deliveries FAILED when their BullMQ job failed', async () => {
    const delivery = await createDelivery();

    const job = mockJob('failed', {
      failedReason: 'Job permanently failed',
    });

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue(job as never);

    const result = await reconcileEventDeliveries();

    const updatedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(result.markedFailed).toBe(1);
    expect(updatedDelivery?.status).toBe('FAILED');
    expect(updatedDelivery?.lastError).toBe('Job permanently failed');
  });

  it('removes completed BullMQ jobs for PENDING deliveries', async () => {
    const delivery = await createDelivery();

    const job = mockJob('completed');

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue(job as never);

    const result = await reconcileEventDeliveries();

    const unchangedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(result.completedJobsRemoved).toBe(1);
    expect(unchangedDelivery?.status).toBe('PENDING');
    expect(job.remove).toHaveBeenCalledTimes(1);
  });

  it('leaves active BullMQ jobs untouched', async () => {
    const delivery = await createDelivery('PROCESSING');

    const job = mockJob('active');

    vi.spyOn(eventDeliveryQueue, 'getJob').mockResolvedValue(job as never);

    const result = await reconcileEventDeliveries();

    const unchangedDelivery = await prisma.eventDelivery.findUnique({
      where: { id: delivery.id },
    });

    expect(result.skipped).toBe(1);
    expect(unchangedDelivery?.status).toBe('PROCESSING');
    expect(unchangedDelivery?.lockToken).toBe('vitest-lock-token');
    expect(job.remove).not.toHaveBeenCalled();
  });
});
