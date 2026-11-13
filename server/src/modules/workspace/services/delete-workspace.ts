import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

export async function deleteWorkspace(context: ExecutionContext) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;

  return prisma.$transaction(async (tx) => {
    const currentMembership = await tx.membership.findFirst({
      where: {
        workspaceId,
        userId: context.actor.id,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!currentMembership) {
      throw new Error('Only the workspace owner can delete this workspace.');
    }

    await tx.deal.deleteMany({
      where: { workspaceId },
    });

    await tx.lead.deleteMany({
      where: { workspaceId },
    });

    return tx.workspace.delete({
      where: { id: workspaceId },
    });
  });
}
