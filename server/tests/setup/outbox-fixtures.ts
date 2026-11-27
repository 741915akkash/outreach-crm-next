import { randomUUID } from 'node:crypto';

import type { Prisma } from '@/generated/prisma/client.js';

import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';

interface TestOutboxEventOptions {
  eventName?: string;
  eventVersion?: number;
  availableAt?: Date;
  payload?: Prisma.InputJsonValue;
}

/**
 * Creates an isolated workspace for an integration test.
 */
export async function createTestWorkspace() {
  return prisma.workspace.create({
    data: {
      name: `Vitest Workspace ${randomUUID()}`,
    },
  });
}

/**
 * Creates an outbox event with sensible defaults.
 */
export async function createTestOutboxEvent(workspaceId: string, options: TestOutboxEventOptions = {}) {
  return prisma.outboxEvent.create({
    data: {
      workspaceId,
      eventId: randomUUID(),
      eventName: options.eventName ?? EVENT_NAMES.COMPANY_DELETED,
      eventVersion: options.eventVersion ?? 1,
      entityChangedType: 'COMPANY',
      entityChangedId: '123',
      actorType: 'SYSTEM',
      actorId: 'vitest',
      operationId: randomUUID(),
      payload: options.payload ?? {
        id: 123,
        name: 'Test Company',
      },
      ...(options.availableAt ? { availableAt: options.availableAt } : {}),
    },
  });
}

export async function clearTestEventData(): Promise<void> {
  await prisma.eventDeliveryAttempt.deleteMany();
  await prisma.eventDelivery.deleteMany();
  await prisma.outboxEvent.deleteMany();
}
