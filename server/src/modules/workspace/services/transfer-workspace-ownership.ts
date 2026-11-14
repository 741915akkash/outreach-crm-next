import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { requireWorkspaceRole } from './require-workspace-role.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

type TransferWorkspaceOwnershipInput = {
  targetMembershipId: string;
};

export async function transferWorkspaceOwnership(
  context: ExecutionContext,
  { targetMembershipId }: TransferWorkspaceOwnershipInput,
) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  return prisma.$transaction(async (tx) => {
    const currentMembership = await tx.membership.findFirst({
      where: {
        workspaceId,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!currentMembership) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'Only the workspace owner can transfer ownership.', 403);
    }

    const targetMembership = await tx.membership.findFirst({
      where: {
        id: targetMembershipId,
        workspaceId,
      },
    });

    if (!targetMembership) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Workspace member not found.', 404);
    }

    if (targetMembership.userId === userId) {
      throw new AppError(ERROR_CODES.BUSINESS_RULE_VIOLATION, 'You are already the workspace owner.', 409);
    }

    if (targetMembership.role !== WorkspaceRole.ADMIN && targetMembership.role !== WorkspaceRole.MEMBER) {
      throw new AppError(
        ERROR_CODES.BUSINESS_RULE_VIOLATION,
        'Selected member cannot become the workspace owner.',
        409,
      );
    }

    const updatedTarget = await tx.membership.update({
      where: { id: targetMembership.id },
      data: { role: WorkspaceRole.OWNER },
    });

    const updatedCurrentOwner = await tx.membership.update({
      where: { id: currentMembership.id },
      data: { role: WorkspaceRole.ADMIN },
    });

    return {
      newOwner: updatedTarget,
      previousOwner: updatedCurrentOwner,
    };
  });
}
