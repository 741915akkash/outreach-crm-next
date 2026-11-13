import { createHash } from 'node:crypto';

import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

type AcceptInvitationInput = {
  token: string;
};

export async function acceptInvitation(context: AuthenticatedContext, { token }: AcceptInvitationInput) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
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
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
  }

  if (!user.emailVerified) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Email verification is required.', 403);
  }

  if (!token.trim()) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invitation token is required.', 400);
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const normalizedEmail = user.email.trim().toLowerCase();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.expiresAt <= now || invitation.revokedAt || invitation.acceptedAt) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Invitation is invalid or expired.', 404);
    }

    if (invitation.email.trim().toLowerCase() !== normalizedEmail) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'This invitation belongs to a different email address.', 403);
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
      throw new AppError(ERROR_CODES.CONFLICT, 'You are already a member of this workspace.', 409);
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
      throw new AppError(ERROR_CODES.CONFLICT, 'Invitation has already been accepted or is no longer valid.', 409);
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
