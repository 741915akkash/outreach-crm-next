import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function deleteTask(context: ExecutionContext, taskId: number) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Only workspace users can delete tasks.', 403);
  }

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  try {
    return await prisma.$transaction(
      async (tx) => {
        const existingTask = await tx.task.findFirst({
          where: {
            id: taskId,
            workspaceId,
            OR: [
              { visibility: 'EVERYONE' },
              { createdById: userId },
              { assignedToId: userId },
              ...(context.workspace.role === 'OWNER' ? [{}] : []),
            ],
          },
          select: {
            id: true,
            status: true,
            createdById: true,
          },
        });

        if (!existingTask) {
          throw new AppError(ERROR_CODES.NOT_FOUND, 'Task not found.', 404);
        }

        if (existingTask.status === 'DONE') {
          throw new AppError(ERROR_CODES.CONFLICT, 'Completed tasks cannot be deleted.', 409);
        }

        if (existingTask.createdById !== userId) {
          throw new AppError(ERROR_CODES.FORBIDDEN, 'Only the task creator can delete this task.', 403);
        }

        // Delete only if the task still has its previously-read state.
        const result = await tx.task.deleteMany({
          where: {
            id: existingTask.id,
            workspaceId,
            createdById: userId,
            status: existingTask.status,
          },
        });

        if (result.count === 0) {
          throw new AppError(ERROR_CODES.CONFLICT, 'The task was modified by another request. Please try again.', 409);
        }

        return {
          id: taskId,
          deleted: true,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new AppError(
          ERROR_CODES.CONFLICT,
          'Task cannot be deleted because it is associated with existing records.',
          409,
        );
      }

      if (error.code === 'P2034') {
        throw new AppError(ERROR_CODES.CONFLICT, 'The task was modified by another request. Please try again.', 409);
      }
    }

    throw error;
  }
}
