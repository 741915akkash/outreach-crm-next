import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a lead timeline activity when a lead-created event is processed.
 */
export const leadCreatedSubscriber: EventSubscriber<typeof EVENT_NAMES.LEAD_CREATED> = {
  id: 'lead-created-activity',
  eventName: EVENT_NAMES.LEAD_CREATED,

  async handler(event) {
    await prisma.$transaction(async (tx) => {
      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'CREATED',
            content: `Lead "${event.payload.name}" was created.`,
            sourceEventId: event.eventId,
            metadata: {
              leadId: event.payload.id,
              leadName: event.payload.name,
              companyId: event.payload.companyId,
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

      const lead = await tx.lead.findFirst({
        where: {
          id: event.payload.id,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
        },
      });

      if (lead) {
        await tx.activityLead.createMany({
          data: [
            {
              workspaceId: event.workspaceId,
              activityId: activity.id,
              leadId: lead.id,
            },
          ],
          skipDuplicates: true,
        });
      }

      if (event.payload.companyId !== null) {
        const company = await tx.company.findFirst({
          where: {
            id: event.payload.companyId,
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
      }
    });
  },
};
