import 'server-only';

import { WorkspaceRole } from '@/generated/prisma/enums';
import { prisma } from '@server/db/client';
import { requireWorkspaceRole } from './require-workspace-role';

type TransferWorkspaceOwnershipInput = {
  workspaceId: string;
  targetMembershipId: string;
};

export async function transferWorkspaceOwnership({
  workspaceId,
  targetMembershipId,
}: TransferWorkspaceOwnershipInput) {
  const { user, membership: currentMembership } = await requireWorkspaceRole(
    workspaceId,
    [WorkspaceRole.OWNER],
  );

  return prisma.$transaction(async (tx) => {
    const targetMembership = await tx.membership.findFirst({
      where: {
        id: targetMembershipId,
        workspaceId,
      },
    });

    if (!targetMembership) {
      throw new Error('Workspace member not found.');
    }

    if (targetMembership.userId === user.id) {
      throw new Error('You are already the workspace owner.');
    }

    if (
      targetMembership.role !== WorkspaceRole.ADMIN &&
      targetMembership.role !== WorkspaceRole.MEMBER
    ) {
      throw new Error('Selected member cannot become the workspace owner.');
    }

    const updatedTarget = await tx.membership.update({
      where: {
        id: targetMembership.id,
      },
      data: {
        role: WorkspaceRole.OWNER,
      },
    });

    const updatedCurrentOwner = await tx.membership.update({
      where: {
        id: currentMembership.id,
      },
      data: {
        role: WorkspaceRole.ADMIN,
      },
    });

    return {
      newOwner: updatedTarget,
      previousOwner: updatedCurrentOwner,
    };
  });
}
