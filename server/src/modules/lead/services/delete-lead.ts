import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function deleteLead(context: ExecutionContext, leadId: number) {
  const workspaceId = context.workspace.workspaceId;

  const result = await prisma.lead.deleteMany({
    where: {
      id: leadId,
      workspaceId,
    },
  });

  if (result.count === 0) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Lead not found.', 404);
  }

  return {
    id: leadId,
    deleted: true,
  };
}
