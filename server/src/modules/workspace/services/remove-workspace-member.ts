import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type RemoveWorkspaceMemberInput = {
  membershipId: string;
};

export async function removeWorkspaceMember(context: ExecutionContext, { membershipId }: RemoveWorkspaceMemberInput) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  return prisma.$transaction(async (tx) => {
    const membership = await tx.membership.findFirst({
      where: {
        id: membershipId,
        workspaceId,
      },
    });

    if (!membership) {
      throw new Error('Workspace member not found.');
    }

    if (membership.userId === userId) {
      throw new Error('You cannot remove yourself from this workspace.');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new Error('Workspace ownership must be transferred before removal.');
    }

    await tx.membership.delete({
      where: { id: membership.id },
    });

    return membership;
  });
}
