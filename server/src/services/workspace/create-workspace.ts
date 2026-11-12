import { prisma } from '@server/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type CreateWorkspaceInput = {
  currentWorkspaceId: string;
  name: string;
};

export async function createWorkspace({ currentWorkspaceId, name }: CreateWorkspaceInput) {
  const { user } = await requireWorkspaceRole(currentWorkspaceId, ['OWNER']);

  const workspaceName = name.trim();

  if (!workspaceName) {
    throw new Error('Workspace name is required.');
  }

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });

    return workspace;
  });
}
