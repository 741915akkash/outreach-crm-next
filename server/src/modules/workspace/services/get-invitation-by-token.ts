import { createHash } from 'node:crypto';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

type GetInvitationByTokenInput = {
  token: string;
};

export async function getInvitationByToken({ token }: GetInvitationByTokenInput) {
  if (!token.trim()) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invitation token is required.', 400);
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
