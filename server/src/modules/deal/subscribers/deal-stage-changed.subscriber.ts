import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a deal timeline activity when a deal changes pipeline stage.
 */
export const dealStageChangedSubscriber: EventSubscriber<typeof EVENT_NAMES.DEAL_STAGE_CHANGED> = {
  id: 'deal-stage-changed-activity',
  eventName: EVENT_NAMES.DEAL_STAGE_CHANGED,

  async handler(event) {
    await prisma.$transaction(async (tx) => {
      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'STAGE_CHANGED',
            content: 'Deal stage was changed.',
            sourceEventId: event.eventId,
            metadata: {
              dealId: event.payload.id,
              previousStageId: event.payload.previousStageId,
              newStageId: event.payload.newStageId,
            },
          },
        ],
        skipDuplicates: true,
      });

      const activity = await tx.activity.findUnique({
        where: {
          sourceEventId: event.eventId,
        },
        select: {
          id: true,
        },
      });

      if (!activity) {
        throw new Error(`Could not find activity for event "${event.eventId}".`);
      }

      const deal = await tx.deal.findFirst({
        where: {
          id: event.payload.id,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
        },
      });

      if (deal) {
        const stages = await tx.pipelineStage.findMany({
          where: {
            id: {
              in: [event.payload.previousStageId, event.payload.newStageId],
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

        const previousStage = stages.find((stage) => stage.id === event.payload.previousStageId);

        const newStage = stages.find((stage) => stage.id === event.payload.newStageId);

        if (previousStage && newStage) {
          await tx.activity.update({
            where: {
              id: activity.id,
            },
            data: {
              content: `Deal moved from "${previousStage.name}" to "${newStage.name}".`,
            },
          });
        }

        await tx.activityDeal.createMany({
          data: [
            {
              workspaceId: event.workspaceId,
              activityId: activity.id,
              dealId: deal.id,
            },
          ],
          skipDuplicates: true,
        });
      }
    });
  },
};
