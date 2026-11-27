import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a lead timeline activity when a lead-updated event is processed.
 */
export const leadUpdatedSubscriber: EventSubscriber<typeof EVENT_NAMES.LEAD_UPDATED> = {
  id: 'lead-updated-activity',
  eventName: EVENT_NAMES.LEAD_UPDATED,

  async handler(event) {
    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: {
          id: event.payload.id,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
          name: true,
          companyId: true,
        },
      });

      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'UPDATED',
            content: `Lead "${event.payload.changes.name ?? lead?.name ?? 'Lead'}" was updated.`,
            sourceEventId: event.eventId,
            metadata: {
              leadId: event.payload.id,
              changes: event.payload.changes,
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

        if (lead.companyId !== null) {
          await tx.activityCompany.createMany({
            data: [
              {
                workspaceId: event.workspaceId,
                activityId: activity.id,
                companyId: lead.companyId,
              },
            ],
            skipDuplicates: true,
          });
        }
      }
    });
  },
};
