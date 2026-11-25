import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { CreateCompanyInput } from '../schemas/create-company.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function createCompany(context: ExecutionContext, input: CreateCompanyInput) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
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

      const event = createEvent({
        eventName: EVENT_NAMES.COMPANY_CREATED,
        workspaceId,
        entityChanged: {
          type: 'company',
          id: String(company.id),
        },
        actor: context.actor,
        operationId: randomUUID(),
        requestId: context.requestId,
        payload: {
          id: company.id,
          name: company.name,
          website: company.website,
          industry: company.industry,
          address: company.address,
          city: company.city,
          state: company.state,
          country: company.country,
          description: company.description,
          createdAt: company.createdAt.toISOString(),
          updatedAt: company.updatedAt.toISOString(),
        },
      });

      await writeOutboxEvent(tx, event);

      return company;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(ERROR_CODES.CONFLICT, 'A company with this name already exists in this workspace.', 409);
    }

    throw error;
  }
}
