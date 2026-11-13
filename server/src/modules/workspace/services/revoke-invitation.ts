import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type RevokeInvitationInput = {
  invitationId: string;
};

export async function revokeInvitation(context: ExecutionContext, { invitationId }: RevokeInvitationInput) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;

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
