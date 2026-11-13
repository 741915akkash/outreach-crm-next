import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type CreateWorkspaceInput = {
  name: string;
};

export async function createWorkspace(context: ExecutionContext, { name }: CreateWorkspaceInput) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const userId = context.actor.id;

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
        userId,
        workspaceId: workspace.id,
        role: WorkspaceRole.OWNER,
      },
    });

    return workspace;
  });
}
