import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function deleteCompany(context: ExecutionContext, companyId: number) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.findFirst({
        where: {
          id: companyId,
          workspaceId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!company) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Company not found.', 404);
      }

      const result = await tx.company.deleteMany({
        where: {
          id: companyId,
          workspaceId,
        },
      });

      if (result.count === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Company not found.', 404);
      }

      const event = createEvent({
        eventName: EVENT_NAMES.COMPANY_DELETED,
        workspaceId,
        entityChanged: {
          type: 'company',
          id: String(company.id),
        },
        actor: context.actor,
        operationId: randomUUID(),
        requestId: context.requestId,
        payload: {
          id: company.id,
          name: company.name,
        },
      });

      await writeOutboxEvent(tx, event);

      return {
        id: companyId,
        deleted: true,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'Company cannot be deleted because it is associated with existing leads or deals.',
        409,
      );
    }

    throw error;
  }
}
