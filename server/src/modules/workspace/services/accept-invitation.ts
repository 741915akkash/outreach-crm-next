import { createHash } from 'node:crypto';

import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';

type AcceptInvitationInput = {
  token: string;
};

export async function acceptInvitation(context: AuthenticatedContext, { token }: AcceptInvitationInput) {
  if (context.actor.type !== 'USER') {
    throw new Error('Authentication required.');
  }

  const userId = context.actor.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error('Authentication required.');
  }

  if (!user.emailVerified) {
    throw new Error('Email verification is required.');
  }

  if (!token.trim()) {
    throw new Error('Invitation token is required.');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const normalizedEmail = user.email.trim().toLowerCase();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.expiresAt <= now || invitation.revokedAt || invitation.acceptedAt) {
      throw new Error('Invitation is invalid or expired.');
    }

    if (invitation.email.trim().toLowerCase() !== normalizedEmail) {
      throw new Error('This invitation belongs to a different email address.');
    }

    const existingMembership = await tx.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
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
        expiresAt: { gt: now },
      },
      data: {
        acceptedAt: now,
      },
    });

    if (claimed.count !== 1) {
      throw new Error('Invitation has already been accepted or is no longer valid.');
    }

    return tx.membership.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      },
      include: {
        workspace: true,
      },
    });
  });
}
