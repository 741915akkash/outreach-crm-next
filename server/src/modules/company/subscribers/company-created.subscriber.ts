import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a company timeline activity when a company-created event is processed.
 */
export const companyCreatedSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_CREATED> = {
  id: 'company-created-activity',
  eventName: EVENT_NAMES.COMPANY_CREATED,

  async handler(event) {
    await prisma.$transaction(async (tx) => {
      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'CREATED',
            content: `Company "${event.payload.name}" was created.`,
            sourceEventId: event.eventId,
            metadata: {
              companyId: event.payload.id,
              companyName: event.payload.name,
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

      const company = await tx.company.findFirst({
        where: {
          id: event.payload.id,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
        },
      });

      if (company) {
        await tx.activityCompany.createMany({
          data: [
            {
              workspaceId: event.workspaceId,
              activityId: activity.id,
              companyId: company.id,
            },
          ],
          skipDuplicates: true,
        });
      }
    });
  },
};
