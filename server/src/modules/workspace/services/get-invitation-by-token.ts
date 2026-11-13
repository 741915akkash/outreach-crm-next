import { createHash } from 'node:crypto';

import { prisma } from '@server/shared/db/client.js';

type GetInvitationByTokenInput = {
  token: string;
};

export async function getInvitationByToken({ token }: GetInvitationByTokenInput) {
  if (!token.trim()) {
    throw new Error('Invitation token is required.');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const invitation = await prisma.invitation.findUnique({
    where: {
      tokenHash,
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const now = new Date();

  if (!invitation || invitation.expiresAt <= now || invitation.revokedAt || invitation.acceptedAt) {
    return null;
  }

  return {
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    workspace: invitation.workspace,
  };
}
