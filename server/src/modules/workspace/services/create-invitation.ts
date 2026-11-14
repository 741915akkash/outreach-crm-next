import { randomBytes, createHash } from 'node:crypto';

import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type CreateInvitationInput = {
  email: string;
  role: typeof WorkspaceRole.ADMIN | typeof WorkspaceRole.MEMBER;
};

export async function createInvitation(context: ExecutionContext, { email, role }: CreateInvitationInput) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Email is required.', 400);
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
  });

  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMembership) {
      throw new AppError(ERROR_CODES.CONFLICT, 'User is already a member of this workspace.', 409);
    }
  }

  const now = new Date();

  const pendingInvitation = await prisma.invitation.findFirst({
    where: {
      workspaceId,
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
  });

  if (pendingInvitation) {
    throw new AppError(ERROR_CODES.CONFLICT, 'An active invitation already exists for this email.', 409);
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      workspaceId,
      email: normalizedEmail,
      role,
      tokenHash,
      invitedById: userId,
      expiresAt,
    },
  });

  return { invitation, token };
}
