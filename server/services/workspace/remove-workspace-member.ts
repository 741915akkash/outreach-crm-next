import 'server-only';

import { WorkspaceRole } from '@/generated/prisma/enums';
import { prisma } from '@server/db/client';
import { requireWorkspaceRole } from './require-workspace-role';

type RemoveWorkspaceMemberInput = {
  workspaceId: string;
  membershipId: string;
};

export async function removeWorkspaceMember({
  workspaceId,
  membershipId,
}: RemoveWorkspaceMemberInput) {
  const { user } = await requireWorkspaceRole(workspaceId, [
    WorkspaceRole.OWNER,
  ]);

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

    if (membership.userId === user.id) {
      throw new Error('You cannot remove yourself from this workspace.');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new Error('Workspace ownership must be transferred before removal.');
    }

    await tx.membership.delete({
      where: {
        id: membership.id,
      },
    });

    return membership;
  });
}
