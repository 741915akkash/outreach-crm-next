import 'server-only';

import { prisma } from '@server/db/client';

export async function getUserWorkspaces(userId: string) {
  return prisma.membership.findMany({
    where: {
      userId,
    },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
