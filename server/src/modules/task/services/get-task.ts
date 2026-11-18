import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function getTask(context: ExecutionContext, taskId: number) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Only workspace users can access tasks.', 403);
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      workspaceId: context.workspace.workspaceId,
      OR: [
        { visibility: 'EVERYONE' },
        { createdById: context.actor.id },
        { assignedToId: context.actor.id },
        ...(context.workspace.role === 'OWNER' ? [{}] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      assignedToId: true,
      createdById: true,
      leadId: true,
      dealId: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!task) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Task not found.', 404);
  }

  return task;
}
