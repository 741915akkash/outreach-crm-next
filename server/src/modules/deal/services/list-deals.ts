import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { ListDealsQuery } from '../schemas/list-deals.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function listDeals(context: ExecutionContext, query: ListDealsQuery) {
  const { page, limit, search, pipelineId, stageId, companyId, createdFrom, createdTo, sortBy, sortOrder } = query;

  const workspaceId = context.workspace.workspaceId;

  // When both filters are provided, ensure the stage belongs to the pipeline.
  if (pipelineId !== undefined && stageId !== undefined) {
    const stage = await prisma.pipelineStage.findFirst({
      where: {
        id: stageId,
        pipelineId,
        pipeline: {
          workspaceId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!stage) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected stage is invalid for this pipeline.', 400);
    }
  }

  const where: Prisma.DealWhereInput = {
    workspaceId,

    ...(search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {}),

    ...(pipelineId !== undefined ? { pipelineId } : {}),
    ...(stageId !== undefined ? { stageId } : {}),
    ...(companyId !== undefined ? { companyId } : {}),

    ...(createdFrom || createdTo
      ? {
          createdAt: {
            ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
            ...(createdTo ? { lte: new Date(createdTo) } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.DealOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }, { id: 'asc' }];

  const skip = (page - 1) * limit;

  const [deals, total] = await prisma.$transaction([
    prisma.deal.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        value: true,
        currency: true,
        expectedCloseDate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        pipeline: {
          select: {
            id: true,
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            position: true,
          },
        },
        leads: {
          select: {
            isPrimary: true,
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.deal.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: deals,
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
