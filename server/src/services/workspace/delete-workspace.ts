import { WorkspaceRole } from '@/generated/prisma/enums.js';
import { prisma } from '@server/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type DeleteWorkspaceInput = {
  workspaceId: string;
};

export async function deleteWorkspace({ workspaceId }: DeleteWorkspaceInput) {
  const { membership } = await requireWorkspaceRole(workspaceId, [WorkspaceRole.OWNER]);

  return prisma.$transaction(async (tx) => {
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
