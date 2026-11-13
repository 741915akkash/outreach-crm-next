import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type TransferWorkspaceOwnershipInput = {
  targetMembershipId: string;
};

export async function transferWorkspaceOwnership(
  context: ExecutionContext,
  { targetMembershipId }: TransferWorkspaceOwnershipInput,
) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  return prisma.$transaction(async (tx) => {
    const currentMembership = await tx.membership.findFirst({
      where: {
        workspaceId,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!currentMembership) {
      throw new Error('Only the workspace owner can transfer ownership.');
    }

    const targetMembership = await tx.membership.findFirst({
      where: {
        id: targetMembershipId,
        workspaceId,
      },
    });

    if (!targetMembership) {
      throw new Error('Workspace member not found.');
    }

    if (targetMembership.userId === userId) {
      throw new Error('You are already the workspace owner.');
    }

    if (targetMembership.role !== WorkspaceRole.ADMIN && targetMembership.role !== WorkspaceRole.MEMBER) {
      throw new Error('Selected member cannot become the workspace owner.');
    }

    const updatedTarget = await tx.membership.update({
      where: { id: targetMembership.id },
      data: { role: WorkspaceRole.OWNER },
    });

    const updatedCurrentOwner = await tx.membership.update({
      where: { id: currentMembership.id },
      data: { role: WorkspaceRole.ADMIN },
    });

    return {
      newOwner: updatedTarget,
      previousOwner: updatedCurrentOwner,
    };
  });
}
