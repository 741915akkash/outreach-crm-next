import { WorkspaceRole } from '@/generated/prisma/enums.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { requireWorkspaceRole } from './require-workspace-role.js';

export async function deleteWorkspace(context: ExecutionContext) {
  requireWorkspaceRole(context, [WorkspaceRole.OWNER]);

  const workspaceId = context.workspace.workspaceId;

  return prisma.$transaction(async (tx) => {
    const currentMembership = await tx.membership.findFirst({
      where: {
        workspaceId,
        userId: context.actor.id,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!currentMembership) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'Only the workspace owner can delete this workspace.', 403);
    }

    // 1. Delete tasks (reference memberships, leads and deals).
    await tx.task.deleteMany({
      where: { workspaceId },
    });

    // 2. Delete invitations (reference memberships).
    await tx.invitation.deleteMany({
      where: { workspaceId },
    });

    // 3. Delete activity associations.
    await tx.activityLead.deleteMany({
      where: { workspaceId },
    });

    await tx.activityCompany.deleteMany({
      where: { workspaceId },
    });

    await tx.activityDeal.deleteMany({
      where: { workspaceId },
    });

    await tx.activityTask.deleteMany({
      where: { workspaceId },
    });

    // 4. Delete activities.
    await tx.activity.deleteMany({
      where: { workspaceId },
    });

    // 5. Delete deal-lead relationships.
    await tx.dealLead.deleteMany({
      where: { workspaceId },
    });

    // 6. Delete deals and leads.
    await tx.deal.deleteMany({
      where: { workspaceId },
    });

    await tx.lead.deleteMany({
      where: { workspaceId },
    });

    // 7. Delete sequence steps before sequences.
    await tx.sequenceStep.deleteMany({
      where: {
        sequence: { workspaceId },
      },
    });

    // 8. Delete pipeline stages before pipelines.
    await tx.pipelineStage.deleteMany({
      where: {
        pipeline: { workspaceId },
      },
    });

    // 9. Delete supporting CRM records.
    await tx.sequence.deleteMany({
      where: { workspaceId },
    });

    await tx.pipeline.deleteMany({
      where: { workspaceId },
    });

    await tx.source.deleteMany({
      where: { workspaceId },
    });

    await tx.company.deleteMany({
      where: { workspaceId },
    });

    // 10. Delete workspace memberships.
    await tx.membership.deleteMany({
      where: { workspaceId },
    });

    // 11. Finally, delete the workspace.
    return tx.workspace.delete({
      where: { id: workspaceId },
    });
  });
}
