import { createHash } from 'node:crypto';

import { prisma } from '@server/db/client.js';
import { getSession } from '@server/services/auth/get-session.js';

type AcceptInvitationInput = {
  token: string;
};

export async function acceptInvitation({ token }: AcceptInvitationInput) {
  const session = await getSession();

  if (!session) {
    throw new Error('Authentication required.');
  }

  if (!session.user.emailVerified) {
    throw new Error('Email verification is required.');
  }

  if (!token.trim()) {
    throw new Error('Invitation token is required.');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const normalizedEmail = session.user.email.trim().toLowerCase();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!invitation || invitation.expiresAt <= now || invitation.revokedAt || invitation.acceptedAt) {
      throw new Error('Invitation is invalid or no longer active.');
    }

    if (invitation.email.trim().toLowerCase() !== normalizedEmail) {
      throw new Error('This invitation was sent to a different email address.');
    }

    const existingMembership = await tx.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      throw new Error('You are already a member of this workspace.');
    }

    const claimed = await tx.invitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        acceptedAt: now,
      },
    });

    if (claimed.count !== 1) {
      throw new Error('Invitation is invalid or no longer active.');
    }

    return tx.membership.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
        role: invitation.role,
      },
      include: {
        workspace: true,
      },
    });
  });
}
