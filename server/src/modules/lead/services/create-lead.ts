import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { CreateLeadInput } from '../schemas/create-lead.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function createLead(context: ExecutionContext, input: CreateLeadInput) {
  const workspaceId = context.workspace.workspaceId;

  if (input.stageId !== undefined && input.pipelineId === undefined) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A pipeline is required when selecting a stage.', 400);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      let stageId = input.stageId;

      if (input.pipelineId !== undefined) {
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

        if (stageId === undefined) {
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

          stageId = firstStage.id;
        }
      }

      return await tx.lead.create({
        data: {
          workspaceId,
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          companyId: input.companyId ?? null,
          pipelineId: input.pipelineId ?? null,
          stageId: stageId ?? null,
          sourceId: input.sourceId ?? null,
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

