import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a workspace activity when a company-deleted event is processed.
 */
export const companyDeletedSubscriber: EventSubscriber<typeof EVENT_NAMES.COMPANY_DELETED> = {
  id: 'company-deleted-activity',
  eventName: EVENT_NAMES.COMPANY_DELETED,

  async handler(event) {
    await prisma.activity.createMany({
      data: [
        {
          workspaceId: event.workspaceId,
          createdByType: event.actor.type,
          createdById: event.actor.id,
          type: 'DELETED',
          content: `Company "${event.payload.name}" was deleted.`,
          sourceEventId: event.eventId,
          metadata: {
            companyId: event.payload.id,
            companyName: event.payload.name,
          },
        },
      ],
      skipDuplicates: true,
    });
  },
};
