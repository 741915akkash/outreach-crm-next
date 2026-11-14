import { randomBytes, createHash } from 'node:crypto';

import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type ResendInvitationInput = {
  invitationId: string;
};

export async function resendInvitation(context: ExecutionContext, { invitationId }: ResendInvitationInput) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  const now = new Date();

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      workspaceId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
  });

  if (!invitation) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Active invitation not found.', 404);
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const updatedInvitation = await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      tokenHash,
      expiresAt,
      invitedById: userId,
    },
  });

  return { invitation: updatedInvitation, token };
}
