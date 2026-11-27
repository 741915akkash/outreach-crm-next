import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { CreateTaskInput } from '../schemas/create-task.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function createTask(context: ExecutionContext, input: CreateTaskInput) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Only workspace users can create tasks.', 403);
  }

  const workspaceId = context.workspace.workspaceId;
  const createdById = context.actor.id;

  try {
    return await prisma.$transaction(async (tx) => {
      // Validate the creator belongs to the current workspace.
      const creator = await tx.membership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: createdById,
          },
        },
        select: {
          userId: true,
        },
      });

      if (!creator) {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You are not a member of this workspace.', 403);
      }

      // Validate the assignee belongs to the current workspace.
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

      // Validate optional lead belongs to the current workspace.
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

      // Validate optional deal belongs to the current workspace.
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

      // Create the task.
      const task = await tx.task.create({
        data: {
          workspaceId,
          title: input.title,
          description: input.description ?? null,
          status: 'TODO',
          priority: input.priority ?? 'P2',
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          completedAt: null,
          assignedToId: assignee.userId,
          createdById: creator.userId,
          leadId: input.leadId ?? null,
          dealId: input.dealId ?? null,
          visibility: input.visibility ?? 'EVERYONE',
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

      const event = createEvent({
        eventName: EVENT_NAMES.TASK_CREATED,
        workspaceId,
        entityChanged: {
          type: 'task',
          id: String(task.id),
        },
        actor: context.actor,
        operationId: randomUUID(),
        requestId: context.requestId,
        ...(context.initiatedByUserId ? { triggeredBy: context.initiatedByUserId } : {}),
        payload: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() ?? null,
          completedAt: task.completedAt?.toISOString() ?? null,
          assignedToId: task.assignedToId,
          createdById: task.createdById,
          leadId: task.leadId,
          dealId: task.dealId,
          visibility: task.visibility,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        },
      });

      await writeOutboxEvent(tx, event);

      return task;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more selected relationships are invalid.', 400);
    }

    throw error;
  }
}
