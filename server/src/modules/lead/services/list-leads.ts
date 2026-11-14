import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { ListLeadsQuery } from '../schemas/list-leads.schema.js';

import { prisma } from '@server/shared/db/client.js';

export async function listLeads(context: ExecutionContext, query: ListLeadsQuery) {
  const { page, limit, search, companyId, pipelineId, stageId, sourceId, createdFrom, createdTo, sortBy, sortOrder } =
    query;

  const where: Prisma.LeadWhereInput = {
    workspaceId: context.workspace.workspaceId,

    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),

    ...(companyId !== undefined ? { companyId } : {}),
    ...(pipelineId !== undefined ? { pipelineId } : {}),
    ...(stageId !== undefined ? { stageId } : {}),
    ...(sourceId !== undefined ? { sourceId } : {}),

    ...(createdFrom || createdTo
      ? {
          createdAt: {
            ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
            ...(createdTo ? { lte: new Date(createdTo) } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.LeadOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }, { id: 'asc' }];

  const skip = (page - 1) * limit;

  const [leads, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
        source: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: leads,
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
