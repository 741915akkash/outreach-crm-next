import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

type ChangeMemberRoleInput = {
  membershipId: string;
  role: typeof WorkspaceRole.ADMIN | typeof WorkspaceRole.MEMBER;
};

export async function changeMemberRole(context: ExecutionContext, { membershipId, role }: ChangeMemberRoleInput) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  return prisma.$transaction(async (tx) => {
    const membership = await tx.membership.findFirst({
      where: {
        id: membershipId,
        workspaceId,
      },
    });

    if (!membership) {
      throw new Error('Workspace member not found.');
    }

    if (membership.userId === userId) {
      throw new Error('You cannot change your own role.');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new Error('Workspace ownership cannot be changed here.');
    }

    return tx.membership.update({
      where: { id: membership.id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });
}
