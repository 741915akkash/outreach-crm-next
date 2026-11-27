import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

export const leadDeletedSubscriber: EventSubscriber<typeof EVENT_NAMES.LEAD_DELETED> = {
  id: 'lead-deleted-activity',
  eventName: EVENT_NAMES.LEAD_DELETED,

  async handler(event) {
    await prisma.activity.createMany({
      data: [
        {
          workspaceId: event.workspaceId,
          createdByType: event.actor.type,
          createdById: event.actor.id,
          type: 'DELETED',
          content: `Lead "${event.payload.name}" was deleted.`,
          sourceEventId: event.eventId,
          metadata: {
            leadId: event.payload.id,
            leadName: event.payload.name,
          },
        },
      ],
      skipDuplicates: true,
    });
  },
};
