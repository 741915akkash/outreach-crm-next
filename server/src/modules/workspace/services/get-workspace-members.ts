import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';

export async function getWorkspaceMembers(context: ExecutionContext) {
  return prisma.membership.findMany({
    where: {
      workspaceId: context.workspace.workspaceId,
    },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
