import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { publishPendingOutboxEvents } from '@server/shared/events/publisher/outbox-publisher.js';
import { subscriberRegistry } from '@server/shared/events/subscribers/index.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';
import { createEventDeliveries } from '@server/shared/events/deliveries/create-event-deliveries.js';

import { clearTestEventData, createTestOutboxEvent, createTestWorkspace } from '../../setup/outbox-fixtures.js';

const firstSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_DELETED> = {
  id: 'vitest-company-deleted-subscriber-1',
  eventName: EVENT_NAMES.COMPANY_DELETED,
  handler: async () => {},
};

const secondSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_DELETED> = {
  id: 'vitest-company-deleted-subscriber-2',
  eventName: EVENT_NAMES.COMPANY_DELETED,
  handler: async () => {},
};

describe('Outbox Publisher', () => {
  let workspaceId: string | undefined;

  beforeAll(() => {
    subscriberRegistry.register(firstSubscriber);
    subscriberRegistry.register(secondSubscriber);
  });

  beforeEach(async () => {
    await clearTestEventData();

    const workspace = await createTestWorkspace();
    workspaceId = workspace.id;
  });

  afterEach(async () => {
    if (workspaceId) {
      await prisma.workspace.delete({
        where: { id: workspaceId },
      });

      workspaceId = undefined;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('publishes a pending event and creates subscriber deliveries', async () => {
    const event = await createTestOutboxEvent(workspaceId!);

    const result = await publishPendingOutboxEvents();

    expect(result).toEqual({
      published: 1,
      failed: 0,
    });

    const updatedEvent = await prisma.outboxEvent.findUnique({
      where: { id: event.id },
      include: { deliveries: true },
    });

    expect(updatedEvent?.status).toBe('PUBLISHED');
    expect(updatedEvent?.attempts).toBe(1);
    expect(updatedEvent?.publishedAt).not.toBeNull();
    expect(updatedEvent?.lockedAt).toBeNull();
    expect(updatedEvent?.lastError).toBeNull();

    expect(updatedEvent?.deliveries).toHaveLength(2);
    expect(updatedEvent?.deliveries.map((delivery) => delivery.subscriberId)).toEqual(
      expect.arrayContaining([firstSubscriber.id, secondSubscriber.id]),
    );
  });

  it('does not publish events whose availableAt is in the future', async () => {
    const event = await createTestOutboxEvent(workspaceId!, {
      availableAt: new Date(Date.now() + 60_000),
    });

    const result = await publishPendingOutboxEvents();

    expect(result).toEqual({
      published: 0,
      failed: 0,
    });

    const unchangedEvent = await prisma.outboxEvent.findUnique({
      where: { id: event.id },
    });

    expect(unchangedEvent?.status).toBe('PENDING');
    expect(unchangedEvent?.attempts).toBe(0);
    expect(unchangedEvent?.publishedAt).toBeNull();
  });

  it('marks events with unknown versions as FAILED', async () => {
    const event = await createTestOutboxEvent(workspaceId!, {
      eventVersion: 999,
    });

    const result = await publishPendingOutboxEvents();

    expect(result).toEqual({
      published: 0,
      failed: 1,
    });

    const failedEvent = await prisma.outboxEvent.findUnique({
      where: { id: event.id },
    });

    expect(failedEvent?.status).toBe('FAILED');
    expect(failedEvent?.attempts).toBe(1);
    expect(failedEvent?.lastError).toBe('Event "crm.company.deleted" version 999 is not registered.');
  });

  it('ignores events that are already published', async () => {
    const event = await createTestOutboxEvent(workspaceId!);

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    const result = await publishPendingOutboxEvents();

    expect(result).toEqual({
      published: 0,
      failed: 0,
    });

    const deliveries = await prisma.eventDelivery.count({
      where: { eventId: event.eventId },
    });

    expect(deliveries).toBe(0);
  });

  it('does not create duplicate deliveries when delivery creation is repeated', async () => {
    const event = await createTestOutboxEvent(workspaceId!);

    const firstCount = await prisma.$transaction((tx) =>
      createEventDeliveries(tx, event.eventId, EVENT_NAMES.COMPANY_DELETED),
    );

    const secondCount = await prisma.$transaction((tx) =>
      createEventDeliveries(tx, event.eventId, EVENT_NAMES.COMPANY_DELETED),
    );

    expect(firstCount).toBe(2);
    expect(secondCount).toBe(0);

    const totalDeliveries = await prisma.eventDelivery.count({
      where: { eventId: event.eventId },
    });

    expect(totalDeliveries).toBe(2);
  });

  it('processes no more than 50 events in one batch', async () => {
    const events = [];

    for (let i = 0; i < 51; i++) {
      await createTestOutboxEvent(workspaceId!);
    }

    const result = await publishPendingOutboxEvents();

    expect(result).toEqual({
      published: 50,
      failed: 0,
    });

    const publishedCount = await prisma.outboxEvent.count({
      where: {
        workspaceId: workspaceId!,
        status: 'PUBLISHED',
      },
    });

    const pendingCount = await prisma.outboxEvent.count({
      where: {
        workspaceId: workspaceId!,
        status: 'PENDING',
      },
    });

    expect(publishedCount).toBe(50);
    expect(pendingCount).toBe(1);
  });

  it('handles concurrent publishers without publishing an event twice', async () => {
    for (let i = 0; i < 10; i++) {
      await createTestOutboxEvent(workspaceId!);
    }

    const results = await Promise.all([publishPendingOutboxEvents(), publishPendingOutboxEvents()]);

    const totalPublished = results.reduce((total, result) => total + result.published, 0);

    const totalFailed = results.reduce((total, result) => total + result.failed, 0);

    expect(totalPublished).toBe(10);
    expect(totalFailed).toBe(0);

    const publishedCount = await prisma.outboxEvent.count({
      where: {
        workspaceId: workspaceId!,
        status: 'PUBLISHED',
      },
    });

    const deliveryCount = await prisma.eventDelivery.count({
      where: {
        event: {
          workspaceId: workspaceId!,
        },
      },
    });

    expect(publishedCount).toBe(10);
    expect(deliveryCount).toBe(20);
  });
});
