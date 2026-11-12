import { WorkspaceRole } from '@/generated/prisma/enums.js';
import { prisma } from '@server/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type RevokeInvitationInput = {
  workspaceId: string;
  invitationId: string;
};

export async function revokeInvitation({ workspaceId, invitationId }: RevokeInvitationInput) {
  await requireWorkspaceRole(workspaceId, [WorkspaceRole.OWNER]);

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      workspaceId,
      acceptedAt: null,
      revokedAt: null,
    },
  });

  if (!invitation) {
    throw new Error('Active invitation not found.');
  }

  return prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
