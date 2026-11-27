import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { UpdateTaskInput } from '../schemas/update-task.schema.js';
import type { TaskUpdatedPayload } from '@server/shared/events/contracts/event-types.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function updateTask(context: ExecutionContext, taskId: number, input: UpdateTaskInput) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Only workspace users can update tasks.', 403);
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
          },
        });

        if (!existingTask) {
          throw new AppError(ERROR_CODES.NOT_FOUND, 'Task not found.', 404);
        }

        if (existingTask.status === 'DONE') {
          throw new AppError(ERROR_CODES.CONFLICT, 'Completed tasks cannot be modified.', 409);
        }

        const isCreator = existingTask.createdById === userId;
        const isAssignee = existingTask.assignedToId === userId;

        // Only creator and assignee can modify the task.
        if (!isCreator && !isAssignee) {
          throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot modify this task.', 403);
        }

        // Assignee can only change status.
        if (isAssignee && !isCreator) {
          const hasOnlyStatus = Object.keys(input).every((key) => key === 'status');

          if (!hasOnlyStatus || input.status === undefined) {
            throw new AppError(ERROR_CODES.FORBIDDEN, 'Assignees can only change task status.', 403);
          }
        }

        // Validate status transitions.
        if (input.status !== undefined && input.status !== existingTask.status) {
          const allowedTransitions: Record<string, string[]> = {
            TODO: ['IN_PROGRESS', 'DONE'],
            IN_PROGRESS: ['TODO', 'DONE'],
            DONE: [],
          };

          if (!allowedTransitions[existingTask.status]?.includes(input.status)) {
            throw new AppError(ERROR_CODES.BUSINESS_RULE_VIOLATION, 'This task status transition is not allowed.', 409);
          }
        }

        // Validate the new assignee.
        if (input.assignedToId !== undefined) {
          const assignee = await tx.membership.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId,
                userId: input.assignedToId,
              },
            },
            select: {
              userId: true,
            },
          });

          if (!assignee) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected assignee is invalid.', 400);
          }
        }

        // Validate the selected lead.
        if (input.leadId != null) {
          const lead = await tx.lead.findFirst({
            where: {
              id: input.leadId,
              workspaceId,
            },
            select: {
              id: true,
            },
          });

          if (!lead) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected lead is invalid.', 400);
          }
        }

        // Validate the selected deal.
        if (input.dealId != null) {
          const deal = await tx.deal.findFirst({
            where: {
              id: input.dealId,
              workspaceId,
            },
            select: {
              id: true,
            },
          });

          if (!deal) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected deal is invalid.', 400);
          }
        }

        // Update only if the task still has its previously-read state.
        const updateResult = await tx.task.updateMany({
          where: {
            id: existingTask.id,
            workspaceId,
            status: existingTask.status,
            ...(isCreator ? { createdById: userId } : { assignedToId: userId }),
          },
          data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.priority !== undefined ? { priority: input.priority } : {}),
            ...(input.dueDate !== undefined
              ? {
                  dueDate: input.dueDate === null ? null : new Date(input.dueDate),
                }
              : {}),
            ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
            ...(input.leadId !== undefined ? { leadId: input.leadId } : {}),
            ...(input.dealId !== undefined ? { dealId: input.dealId } : {}),
            ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
            ...(input.status !== undefined
              ? {
                  status: input.status,
                  completedAt: input.status === 'DONE' ? new Date() : null,
                }
              : {}),
          },
        });

        if (updateResult.count === 0) {
          throw new AppError(ERROR_CODES.CONFLICT, 'The task was modified by another request. Please try again.', 409);
        }

        const task = await tx.task.findFirst({
          where: {
            id: existingTask.id,
            workspaceId,
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
          return task;
        }

        // Detect actual changes.
        const changes: TaskUpdatedPayload['changes'] = {};

        if (input.title !== undefined && input.title !== existingTask.title) {
          changes.title = input.title;
        }

        if (input.description !== undefined && input.description !== existingTask.description) {
          changes.description = input.description;
        }

        if (input.status !== undefined && input.status !== existingTask.status) {
          changes.status = input.status;
        }

        if (input.priority !== undefined && input.priority !== existingTask.priority) {
          changes.priority = input.priority;
        }

        if (input.dueDate !== undefined) {
          const nextDueDate = input.dueDate === null ? null : new Date(input.dueDate);
          const dueDateChanged =
            existingTask.dueDate === null
              ? nextDueDate !== null
              : nextDueDate === null || nextDueDate.getTime() !== existingTask.dueDate.getTime();

          if (dueDateChanged) {
            changes.dueDate = nextDueDate?.toISOString() ?? null;
          }
        }

        if (input.assignedToId !== undefined && input.assignedToId !== existingTask.assignedToId) {
          changes.assignedToId = input.assignedToId;
        }

        if (input.leadId !== undefined && input.leadId !== existingTask.leadId) {
          changes.leadId = input.leadId;
        }

        if (input.dealId !== undefined && input.dealId !== existingTask.dealId) {
          changes.dealId = input.dealId;
        }

        if (input.visibility !== undefined && input.visibility !== existingTask.visibility) {
          changes.visibility = input.visibility;
        }

        if (task.completedAt?.getTime() !== existingTask.completedAt?.getTime()) {
          changes.completedAt = task.completedAt?.toISOString() ?? null;
        }

        const operationId = randomUUID();

        if (Object.keys(changes).length > 0) {
          const event = createEvent({
            eventName: EVENT_NAMES.TASK_UPDATED,
            workspaceId,
            entityChanged: {
              type: 'task',
              id: String(task.id),
            },
            actor: context.actor,
            operationId,
            requestId: context.requestId,
            ...(context.initiatedByUserId ? { triggeredBy: context.initiatedByUserId } : {}),
            payload: {
              id: task.id,
              changes,
            },
          });

          await writeOutboxEvent(tx, event);
        }

        // Emit TASK_COMPLETED only on the transition to DONE.
        if (task.status === 'DONE' && task.completedAt) {
          const event = createEvent({
            eventName: EVENT_NAMES.TASK_COMPLETED,
            workspaceId,
            entityChanged: {
              type: 'task',
              id: String(task.id),
            },
            actor: context.actor,
            operationId,
            requestId: context.requestId,
            ...(context.initiatedByUserId ? { triggeredBy: context.initiatedByUserId } : {}),
            payload: {
              id: task.id,
              title: task.title,
              completedAt: task.completedAt.toISOString(),
            },
          });

          await writeOutboxEvent(tx, event);
        }

        return task;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more selected relationships are invalid.', 400);
      }

      if (error.code === 'P2034') {
        throw new AppError(ERROR_CODES.CONFLICT, 'The task was modified by another request. Please try again.', 409);
      }
    }

    throw error;
  }
}
