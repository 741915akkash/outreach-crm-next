import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function getDeal(context: ExecutionContext, dealId: number) {
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      workspaceId: context.workspace.workspaceId,
    },
    select: {
      id: true,
      name: true,
      value: true,
      currency: true,
      expectedCloseDate: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      pipeline: {
        select: {
          id: true,
          name: true,
        },
      },
      stage: {
        select: {
          id: true,
          name: true,
          color: true,
          position: true,
        },
      },
      leads: {
        select: {
          isPrimary: true,
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!deal) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Deal not found.', 404);
  }

  return deal;
}