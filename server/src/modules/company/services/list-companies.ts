import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { ListCompaniesQuery } from '../schemas/list-companies.schema.js';

import { prisma } from '@server/shared/db/client.js';

export async function listCompanies(context: ExecutionContext, query: ListCompaniesQuery) {
  const { page, limit, search, industry, country, sortBy, sortOrder } = query;

  const where: Prisma.CompanyWhereInput = {
    workspaceId: context.workspace.workspaceId,

    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { website: { contains: search, mode: 'insensitive' } },
            { industry: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),

    ...(industry ? { industry } : {}),
    ...(country ? { country } : {}),
  };

  const orderBy: Prisma.CompanyOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }, { id: 'asc' }];

  const skip = (page - 1) * limit;

  const [companies, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        address: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.company.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: companies,
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
