import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function getLead(context: ExecutionContext, leadId: number) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId: context.workspace.workspaceId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
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
      source: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!lead) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Lead not found.', 404);
  }

  return lead;
}
