import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function deleteDeal(context: ExecutionContext, dealId: number) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findFirst({
        where: {
          id: dealId,
          workspaceId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!deal) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Deal not found.', 404);
      }

      const result = await tx.deal.deleteMany({
        where: {
          id: dealId,
          workspaceId,
        },
      });

      if (result.count === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Deal not found.', 404);
      }

      const event = createEvent({
        eventName: EVENT_NAMES.DEAL_DELETED,
        workspaceId,
        entityChanged: {
          type: 'deal',
          id: String(deal.id),
        },
        actor: context.actor,
        operationId: randomUUID(),
        requestId: context.requestId,
        ...(context.initiatedByUserId ? { triggeredBy: context.initiatedByUserId } : {}),
        payload: {
          id: deal.id,
          name: deal.name,
        },
      });

      await writeOutboxEvent(tx, event);

      return {
        id: dealId,
        deleted: true,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'Deal cannot be deleted because it is associated with existing records.',
        409,
      );
    }

    throw error;
  }
}
