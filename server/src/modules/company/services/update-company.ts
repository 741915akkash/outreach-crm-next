import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { UpdateCompanyInput } from '../schemas/update-company.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function updateCompany(context: ExecutionContext, companyId: number, input: UpdateCompanyInput) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.company
      .updateManyAndReturn({
        where: {
          id: companyId,
          workspaceId,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.website !== undefined ? { website: input.website } : {}),
          ...(input.industry !== undefined ? { industry: input.industry } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.city !== undefined ? { city: input.city } : {}),
          ...(input.state !== undefined ? { state: input.state } : {}),
          ...(input.country !== undefined ? { country: input.country } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        },
        select: {
          id: true,
          name: true,
          website: true,
          industry: true,
          address: true,
          city: true,
          state: true,
          country: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .then((companies) => {
        if (companies.length === 0) {
          throw new AppError(ERROR_CODES.NOT_FOUND, 'Company not found.', 404);
        }

        return companies[0];
      });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(ERROR_CODES.CONFLICT, 'A company with this name already exists in this workspace.', 409);
    }

    throw error;
  }
}
