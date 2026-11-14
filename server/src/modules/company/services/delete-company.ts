import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function deleteCompany(context: ExecutionContext, companyId: number) {
  const workspaceId = context.workspace.workspaceId;

  try {
    const result = await prisma.company.deleteMany({
      where: {
        id: companyId,
        workspaceId,
      },
    });

    if (result.count === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Company not found.', 404);
    }

    return {
      id: companyId,
      deleted: true,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'Company cannot be deleted because it is associated with existing leads or deals.',
        409,
      );
    }

    throw error;
  }
}
