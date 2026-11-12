import { prisma } from '@server/db/client.js';

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
