import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a deal timeline activity when a deal-created event is processed.
 */
export const dealCreatedSubscriber: EventSubscriber<typeof EVENT_NAMES.DEAL_CREATED> = {
  id: 'deal-created-activity',
  eventName: EVENT_NAMES.DEAL_CREATED,

  async handler(event) {
    await prisma.$transaction(async (tx) => {
      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'CREATED',
            content: `Deal "${event.payload.name}" was created.`,
            sourceEventId: event.eventId,
            metadata: {
              dealId: event.payload.id,
              dealName: event.payload.name,
              companyId: event.payload.companyId,
              value: event.payload.value,
              currency: event.payload.currency,
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
