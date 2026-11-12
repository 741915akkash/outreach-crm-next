import { createHash, randomBytes } from 'node:crypto';

import { WorkspaceRole } from '@/generated/prisma/enums.js';
import { prisma } from '@server/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type CreateInvitationInput = {
  workspaceId: string;
  email: string;
  role: typeof WorkspaceRole.ADMIN | typeof WorkspaceRole.MEMBER;
};

const INVITATION_EXPIRY_DAYS = 7;

export async function createInvitation({ workspaceId, email, role }: CreateInvitationInput) {
  const { user } = await requireWorkspaceRole(workspaceId, [WorkspaceRole.OWNER]);

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Email address is required.');
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
      throw new Error('User is already a member of this workspace.');
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
      expiresAt: {
        gt: now,
      },
    },
  });

  if (pendingInvitation) {
    throw new Error('A pending invitation already exists for this email.');
  }

  const token = randomBytes(32).toString('base64url');

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      workspaceId,
      email: normalizedEmail,
      role,
      tokenHash,
      invitedById: user.id,
      expiresAt,
    },
  });

  return {
    invitation,
    token,
  };
}
