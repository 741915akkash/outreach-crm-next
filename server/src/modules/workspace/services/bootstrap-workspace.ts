import { prisma } from '@server/shared/db/client.js';

type BootstrapWorkspaceInput = {
  userId: string;
  userName: string;
};

export async function bootstrapWorkspace({ userId, userName }: BootstrapWorkspaceInput) {
  return prisma.$transaction(async (tx) => {
    const [userCount, workspaceCount] = await Promise.all([tx.user.count(), tx.workspace.count()]);

    if (userCount !== 1 || workspaceCount !== 0) {
      return null;
    }

    const name = userName.trim() ? `${userName.trim()}'s Workspace` : 'My Workspace';

    const workspace = await tx.workspace.create({
      data: { name },
    });

    await tx.membership.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });

    return workspace;
  });
}
