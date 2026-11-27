import { randomUUID } from 'node:crypto';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function deleteLead(context: ExecutionContext, leadId: number) {
  const workspaceId = context.workspace.workspaceId;

  return await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: {
        id: leadId,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!lead) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Lead not found.', 404);
    }

    const result = await tx.lead.deleteMany({
      where: {
        id: leadId,
        workspaceId,
      },
    });

    if (result.count === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Lead not found.', 404);
    }

    const event = createEvent({
      eventName: EVENT_NAMES.LEAD_DELETED,
      workspaceId,
      entityChanged: {
        type: 'lead',
        id: String(lead.id),
      },
      actor: context.actor,
      operationId: randomUUID(),
      requestId: context.requestId,
      ...(context.initiatedByUserId ? { triggeredBy: context.initiatedByUserId } : {}),
      payload: {
        id: lead.id,
        name: lead.name,
      },
    });

    await writeOutboxEvent(tx, event);

    return {
      id: leadId,
      deleted: true,
    };
  });
}
