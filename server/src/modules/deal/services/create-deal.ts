import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { CreateDealInput } from '../schemas/create-deal.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function createDeal(context: ExecutionContext, input: CreateDealInput) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.$transaction(async (tx) => {
      // Validate pipeline belongs to the current workspace.
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

      // Validate stage belongs to the selected pipeline.
      const stage = await tx.pipelineStage.findFirst({
        where: {
          id: input.stageId,
          pipelineId: pipeline.id,
        },
        select: {
          id: true,
        },
      });

      if (!stage) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected stage is invalid for this pipeline.', 400);
      }

      // Validate optional company belongs to the current workspace.
      if (input.companyId != null) {
        const company = await tx.company.findFirst({
          where: {
            id: input.companyId,
            workspaceId,
          },
          select: {
            id: true,
          },
        });

        if (!company) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected company is invalid.', 400);
        }
      }

      // Validate all associated leads belong to the current workspace.
      const leadIds = input.leadIds ?? [];
      const primaryLeadIds = new Set(input.primaryLeadIds ?? []);

      if (leadIds.length > 0) {
        const leads = await tx.lead.findMany({
          where: {
            id: {
              in: leadIds,
            },
            workspaceId,
          },
          select: {
            id: true,
          },
        });

        if (leads.length !== leadIds.length) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more selected leads are invalid.', 400);
        }
      }

      // Create the deal.
      const deal = await tx.deal.create({
        data: {
          workspaceId,
          name: input.name,
          companyId: input.companyId ?? null,
          pipelineId: pipeline.id,
          stageId: stage.id,
          value: input.value ?? null,
          currency: input.currency ?? null,
          expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
          description: input.description ?? null,
        },
        select: {
          id: true,
          name: true,
          value: true,
          currency: true,
          expectedCloseDate: true,
          description: true,
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
        },
      });

      // Create lead associations, including their primary status.
      if (leadIds.length > 0) {
        await tx.dealLead.createMany({
          data: leadIds.map((leadId) => ({
            workspaceId,
            dealId: deal.id,
            leadId,
            isPrimary: primaryLeadIds.has(leadId),
          })),
        });
      }

      return {
        ...deal,
        leads: await tx.dealLead.findMany({
          where: {
            workspaceId,
            dealId: deal.id,
          },
          select: {
            isPrimary: true,
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more selected relationships are invalid.', 400);
    }

    throw error;
  }
}
