import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

export const dealUpdatedSubscriber: EventSubscriber<typeof EVENT_NAMES.DEAL_UPDATED> = {
  id: 'deal-updated-activity',
  eventName: EVENT_NAMES.DEAL_UPDATED,

  async handler(event) {
    // Stage changes have their own STAGE_CHANGED activity.
    // Exclude stageId and pipelineId to avoid duplicate activities.
    const changes = Object.fromEntries(
      Object.entries(event.payload.changes).filter(([key]) => key !== 'stageId' && key !== 'pipelineId'),
    );

    if (Object.keys(changes).length === 0) return;

    await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findFirst({
        where: {
          id: event.payload.id,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'UPDATED',
            content: `Deal "${event.payload.changes.name ?? deal?.name ?? 'Deal'}" was updated.`,
            sourceEventId: event.eventId,
            metadata: {
              dealId: event.payload.id,
              changes,
            },
          },
        ],
        skipDuplicates: true,
      });

      const activity = await tx.activity.findUnique({
        where: { sourceEventId: event.eventId },
        select: { id: true },
      });

      if (!activity) {
        throw new Error('Activity was not found after creation.');
      }

      if (deal) {
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
