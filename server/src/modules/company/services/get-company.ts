import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function getCompany(context: ExecutionContext, companyId: number) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      workspaceId: context.workspace.workspaceId,
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
      _count: {
        select: {
          leads: true,
          deals: true,
        },
      },
    },
  });

  if (!company) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Company not found.', 404);
  }

  return company;
}
