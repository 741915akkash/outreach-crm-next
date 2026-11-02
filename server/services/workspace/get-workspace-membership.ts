import 'server-only';

import { prisma } from '@server/db/client';

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string,
) {
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
