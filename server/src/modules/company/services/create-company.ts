import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { CreateCompanyInput } from '../schemas/create-company.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function createCompany(context: ExecutionContext, input: CreateCompanyInput) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.company.create({
      data: {
        workspaceId,
        name: input.name,
        website: input.website ?? null,
        industry: input.industry ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        country: input.country ?? null,
        description: input.description ?? null,
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
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(ERROR_CODES.CONFLICT, 'A company with this name already exists in this workspace.', 409);
    }

    throw error;
  }
}

