import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { UpdateLeadInput } from '../schemas/update-lead.schema.js';
import type { LeadUpdatedPayload } from '@server/shared/events/contracts/event-types.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import { createEvent } from '@server/shared/events/factory/event-factory.js';
import { writeOutboxEvent } from '@server/shared/events/outbox/outbox-writer.js';

export async function updateLead(context: ExecutionContext, leadId: number, input: UpdateLeadInput) {
  const workspaceId = context.workspace.workspaceId;

  // A stage cannot be selected without a pipeline.
  const effectivePipelineId = input.pipelineId;

  if (input.stageId !== undefined && effectivePipelineId === undefined) {
    // The existing pipeline must be checked inside the transaction.
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Confirm that the lead belongs to the current workspace.
      const existingLead = await tx.lead.findFirst({
        where: {
          id: leadId,
          workspaceId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyId: true,
          pipelineId: true,
          stageId: true,
          sourceId: true,
        },
      });

      if (!existingLead) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Lead not found.', 404);
      }

      const nextPipelineId = input.pipelineId ?? existingLead.pipelineId;

      if (input.stageId !== undefined && nextPipelineId === null) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A pipeline is required when selecting a stage.', 400);
      }

      let nextStageId: number | null | undefined = input.stageId;

      const pipelineChanged = input.pipelineId !== undefined && input.pipelineId !== existingLead.pipelineId;

      if (input.pipelineId !== undefined && pipelineChanged) {
        // Verify that the selected pipeline belongs to this workspace.
        const pipeline = await tx.pipeline.findFirst({
          where: {
            id: input.pipelineId,
            workspaceId,
          },
          select: {
            id: true,
          },
        });

        if (!pipeline) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected pipeline is invalid.', 400);
        }

        // Automatically assign the first stage if none was explicitly selected.
        if (input.stageId === undefined) {
          const firstStage = await tx.pipelineStage.findFirst({
            where: {
              pipelineId: pipeline.id,
            },
            orderBy: {
              position: 'asc',
            },
            select: {
              id: true,
            },
          });

          if (!firstStage) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected pipeline has no stages.', 400);
          }

          nextStageId = firstStage.id;
        }
      }

      const lead = await tx.lead.update({
        where: {
          id: leadId,
          workspaceId,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
          ...(input.pipelineId !== undefined ? { pipelineId: input.pipelineId } : {}),
          ...(nextStageId !== undefined ? { stageId: nextStageId } : {}),
          ...(input.sourceId !== undefined ? { sourceId: input.sourceId } : {}),
        },
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
      });

      const changes: LeadUpdatedPayload['changes'] = {};

      if (input.name !== undefined && input.name !== existingLead.name) {
        changes.name = input.name;
      }

      if (input.email !== undefined && input.email !== existingLead.email) {
        changes.email = input.email;
      }

      if (input.phone !== undefined && input.phone !== existingLead.phone) {
        changes.phone = input.phone;
      }

      if (input.companyId !== undefined && input.companyId !== existingLead.companyId) {
        changes.companyId = input.companyId;
      }

      if (input.pipelineId !== undefined && input.pipelineId !== existingLead.pipelineId) {
        changes.pipelineId = input.pipelineId;
      }

      if (nextStageId !== undefined && nextStageId !== existingLead.stageId) {
        changes.stageId = nextStageId;
      }

      if (input.sourceId !== undefined && input.sourceId !== existingLead.sourceId) {
        changes.sourceId = input.sourceId;
      }

      if (Object.keys(changes).length > 0) {
        const event = createEvent({
          eventName: EVENT_NAMES.LEAD_UPDATED,
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
            changes,
          },
        });

        await writeOutboxEvent(tx, event);
      }

      return lead;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new AppError(ERROR_CODES.CONFLICT, 'A lead with this email already exists in this workspace.', 409);
      }

      if (error.code === 'P2003') {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more selected relationships are invalid.', 400);
      }
    }

    throw error;
  }
}
