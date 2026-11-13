import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

type RemoveWorkspaceMemberInput = {
  membershipId: string;
};

export async function removeWorkspaceMember(context: ExecutionContext, { membershipId }: RemoveWorkspaceMemberInput) {
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
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Workspace member not found.', 404);
    }

    if (membership.userId === userId) {
      throw new AppError(ERROR_CODES.BUSINESS_RULE_VIOLATION, 'You cannot remove yourself from this workspace.', 409);
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new AppError(
        ERROR_CODES.BUSINESS_RULE_VIOLATION,
        'Workspace ownership must be transferred before removal.',
        409,
      );
    }

    await tx.membership.delete({
      where: { id: membership.id },
    });

    return membership;
  });
}
