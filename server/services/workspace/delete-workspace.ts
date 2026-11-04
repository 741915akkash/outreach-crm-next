import 'server-only';

import { WorkspaceRole } from '@/generated/prisma/enums';
import { prisma } from '@server/db/client';
import { requireWorkspaceRole } from './require-workspace-role';

type DeleteWorkspaceInput = {
  workspaceId: string;
};

export async function deleteWorkspace({
  workspaceId,
}: DeleteWorkspaceInput) {
  const { membership } = await requireWorkspaceRole(workspaceId, [
    WorkspaceRole.OWNER,
  ]);

  return prisma.$transaction(async (tx) => {
    // Recheck ownership inside the transaction.
    const currentMembership = await tx.membership.findFirst({
      where: {
        id: membership.id,
        workspaceId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!currentMembership) {
      throw new Error('Only the workspace owner can delete this workspace.');
    }

    // Remove records with restrictive foreign-key dependencies first.
    await tx.deal.deleteMany({
      where: { workspaceId },
    });

    await tx.lead.deleteMany({
      where: { workspaceId },
    });

    // Remaining workspace-owned records are removed through database cascades.
    return tx.workspace.delete({
      where: { id: workspaceId },
    });
  });
}
