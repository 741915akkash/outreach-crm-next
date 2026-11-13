import { prisma } from '@server/shared/db/client.js';
import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function getUserWorkspaces(context: AuthenticatedContext) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
  }

  return prisma.membership.findMany({
    where: {
      userId: context.actor.id,
    },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
