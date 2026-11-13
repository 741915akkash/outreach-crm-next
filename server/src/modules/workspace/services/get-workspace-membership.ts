import { prisma } from '@server/shared/db/client.js';

export async function getWorkspaceMembership(userId: string, workspaceId: string) {
  return prisma.membership.findUnique({
    where: {
      workspaceId_userId: {
        userId,
        workspaceId,
      },
    },
    include: {
      workspace: true,
    },
  });
}
