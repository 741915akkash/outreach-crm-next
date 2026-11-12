import { createHash, randomBytes } from 'node:crypto';

import { WorkspaceRole } from '@/generated/prisma/enums.js';
import { prisma } from '@server/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type ResendInvitationInput = {
  workspaceId: string;
  invitationId: string;
};

const INVITATION_EXPIRY_DAYS = 7;

export async function resendInvitation({ workspaceId, invitationId }: ResendInvitationInput) {
  const { user } = await requireWorkspaceRole(workspaceId, [WorkspaceRole.OWNER]);

  const now = new Date();

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      workspaceId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: {
        gt: now,
      },
    },
  });

  if (!invitation) {
    throw new Error('Active invitation not found.');
  }

  const token = randomBytes(32).toString('base64url');

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const updatedInvitation = await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      tokenHash,
      expiresAt,
      invitedById: user.id,
    },
  });

  return {
    invitation: updatedInvitation,
    token,
  };
}
