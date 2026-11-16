import { Prisma } from '@/generated/prisma/client.js';

import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import type { UpdateDealInput } from '../schemas/update-deal.schema.js';

import { prisma } from '@server/shared/db/client.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function updateDeal(context: ExecutionContext, dealId: number, input: UpdateDealInput) {
  const workspaceId = context.workspace.workspaceId;

  try {
    return await prisma.$transaction(async (tx) => {
      const existingDeal = await tx.deal.findFirst({
        where: {
          id: dealId,
          workspaceId,
        },
        select: {
          id: true,
          pipelineId: true,
          stageId: true,
          leads: {
            select: {
              leadId: true,
              isPrimary: true,
            },
          },
        },
      });

      if (!existingDeal) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Deal not found.', 404);
      }

      // Resolve the pipeline and stage.
      const pipelineChanged = input.pipelineId !== undefined && input.pipelineId !== existingDeal.pipelineId;

      const pipelineId = input.pipelineId ?? existingDeal.pipelineId;

      if (pipelineChanged) {
        const pipeline = await tx.pipeline.findFirst({
          where: {
            id: pipelineId,
            workspaceId,
          },
          select: {
            id: true,
          },
        });

        if (!pipeline) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected pipeline is invalid.', 400);
        }
      }

      let stageId = input.stageId;

      if (pipelineChanged && stageId === undefined) {
        const firstStage = await tx.pipelineStage.findFirst({
          where: {
            pipelineId,
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
      } else {
        stageId ??= existingDeal.stageId;

        const stage = await tx.pipelineStage.findFirst({
          where: {
            id: stageId,
            pipelineId,
          },
          select: {
            id: true,
          },
        });

        if (!stage) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'The selected stage is invalid for this pipeline.', 400);
        }
      }

      // Validate optional company.
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

      // Resolve lead associations.
      const existingLeadPrimaryStatus = new Map(
        existingDeal.leads.map((association) => [association.leadId, association.isPrimary]),
      );

      let nextLeadIds = existingDeal.leads.map((association) => association.leadId);

      if (input.leadIds !== undefined) {
        nextLeadIds = input.leadIds;
      }

      let nextPrimaryLeadIds: Set<number>;

      if (input.primaryLeadIds !== undefined) {
        nextPrimaryLeadIds = new Set(input.primaryLeadIds);
      } else if (input.leadIds !== undefined) {
        // Preserve primary status for retained leads.
        nextPrimaryLeadIds = new Set(nextLeadIds.filter((id) => existingLeadPrimaryStatus.get(id) === true));
      } else {
        // Preserve all existing primary statuses.
        nextPrimaryLeadIds = new Set(
          existingDeal.leads.filter((association) => association.isPrimary).map((association) => association.leadId),
        );
      }

      // Validate primary leads against the final association list.
      if ([...nextPrimaryLeadIds].some((id) => !nextLeadIds.includes(id))) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Every primary lead must also be associated with the deal.',
          400,
        );
      }

      // Validate all final lead associations belong to this workspace.
      if (nextLeadIds.length > 0) {
        const leads = await tx.lead.findMany({
          where: {
            id: {
              in: nextLeadIds,
            },
            workspaceId,
          },
          select: {
            id: true,
          },
        });

        if (leads.length !== nextLeadIds.length) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more selected leads are invalid.', 400);
        }
      }

      // Update the Deal.
      await tx.deal.update({
        where: {
          id: existingDeal.id,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
          ...(input.pipelineId !== undefined || input.stageId !== undefined
            ? {
                pipelineId,
                stageId,
              }
            : {}),
          ...(input.value !== undefined
            ? { value: input.value === null ? null : new Prisma.Decimal(input.value) }
            : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.expectedCloseDate !== undefined
            ? {
                expectedCloseDate: input.expectedCloseDate === null ? null : new Date(input.expectedCloseDate),
              }
            : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        },
      });

      // Replace lead associations only when leadIds or primaryLeadIds is supplied.
      if (input.leadIds !== undefined || input.primaryLeadIds !== undefined) {
        await tx.dealLead.deleteMany({
          where: {
            workspaceId,
            dealId: existingDeal.id,
          },
        });

        if (nextLeadIds.length > 0) {
          await tx.dealLead.createMany({
            data: nextLeadIds.map((leadId) => ({
              workspaceId,
              dealId: existingDeal.id,
              leadId,
              isPrimary: nextPrimaryLeadIds.has(leadId),
            })),
          });
        }
      }

      // Return the updated Deal with its relationships.
      return tx.deal.findFirstOrThrow({
        where: {
          id: existingDeal.id,
          workspaceId,
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
          leads: {
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
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more selected relationships are invalid.', 400);
    }

    throw error;
  }
}
