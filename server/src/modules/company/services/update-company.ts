import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { UpdateCompanyInput } from '../schemas/update-company.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { randomUUID } from 'node:crypto';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function updateCompany(context: ExecutionContext, companyId: number, input: UpdateCompanyInput) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.$transaction(async (tx) => {
      const existingCompany = await tx.company.findFirst({
        where: {
          id: companyId,
          workspaceId,
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
        },
      });

      if (!existingCompany) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Company not found.', 404);
      }

      const companies = await tx.company.updateManyAndReturn({
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
      });

      if (companies.length === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Company not found.', 404);
      }

      const company = companies[0];

      const changes: Record<string, unknown> = {};

      for (const key of Object.keys(input) as (keyof UpdateCompanyInput)[]) {
        if (input[key] !== existingCompany[key]) {
          changes[key] = input[key];
        }
      }

      if (Object.keys(changes).length > 0) {
        const event = createEvent({
          eventName: EVENT_NAMES.COMPANY_UPDATED,
          workspaceId,
          entityChanged: {
            type: 'company',
            id: String(company.id),
          },
          actor: context.actor,
          operationId: randomUUID(),
          requestId: context.requestId,
          ...(context.initiatedByUserId ? { triggeredBy: context.initiatedByUserId } : {}),
          payload: {
            id: company.id,
            changes,
          },
        });

        await writeOutboxEvent(tx, event);
      }

      return company;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(ERROR_CODES.CONFLICT, 'A company with this name already exists in this workspace.', 409);
    }

    throw error;
  }
}
