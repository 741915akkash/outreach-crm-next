import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

export async function getWorkspaceInvitations(context: ExecutionContext) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

  const invitations = await prisma.invitation.findMany({
    where: {
      workspaceId: context.workspace.workspaceId,
      acceptedAt: null,
      revokedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const now = new Date();

  return invitations.map((invitation) => ({
    ...invitation,
    status: invitation.expiresAt > now ? 'PENDING' : 'EXPIRED',
  }));
}
