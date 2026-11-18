import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { ListTasksQuery } from '../schemas/list-tasks.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function listTasks(context: ExecutionContext, query: ListTasksQuery) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Only workspace users can access tasks.', 403);
  }

  const {
    page,
    limit,
    search,
    assignedToId,
    createdById,
    status,
    priority,
    visibility,
    leadId,
    dealId,
    dueDateFrom,
    dueDateTo,
    sortBy,
    sortOrder,
  } = query;

  const workspaceId = context.workspace.workspaceId;
  const userId = context.actor.id;

  const visibilityFilter: Prisma.TaskWhereInput =
    context.workspace.role === 'OWNER'
      ? {}
      : {
          OR: [{ visibility: 'EVERYONE' }, { createdById: userId }, { assignedToId: userId }],
        };

  const searchFilter: Prisma.TaskWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const where: Prisma.TaskWhereInput = {
    workspaceId,

    // Apply visibility restrictions before filters and pagination.
    AND: [visibilityFilter, searchFilter],

    ...(assignedToId ? { assignedToId } : {}),
    ...(createdById ? { createdById } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(visibility ? { visibility } : {}),
    ...(leadId !== undefined ? { leadId } : {}),
    ...(dealId !== undefined ? { dealId } : {}),

    ...(dueDateFrom || dueDateTo
      ? {
          dueDate: {
            ...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
            ...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];

  if (sortBy === 'priority') {
    orderBy.push({ priority: sortOrder });
  } else if (sortBy === 'dueDate') {
    orderBy.push({
      dueDate: {
        sort: sortOrder,
        nulls: 'last',
      },
    });
  } else {
    orderBy.push({ [sortBy]: sortOrder });
  }

  // Consistent ordering for pagination.
  orderBy.push({ id: 'asc' });

  const skip = (page - 1) * limit;

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
    }),
    prisma.task.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}
