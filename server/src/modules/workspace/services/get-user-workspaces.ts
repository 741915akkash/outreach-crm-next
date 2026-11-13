import { prisma } from '@server/shared/db/client.js';
import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';

export async function getUserWorkspaces(context: AuthenticatedContext) {
  if (context.actor.type !== 'USER') {
    throw new Error('Authentication required.');
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
