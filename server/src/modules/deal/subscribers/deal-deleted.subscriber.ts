import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

export const dealDeletedSubscriber: EventSubscriber<typeof EVENT_NAMES.DEAL_DELETED> = {
  id: 'deal-deleted-activity',
  eventName: EVENT_NAMES.DEAL_DELETED,

  async handler(event) {
    await prisma.activity.createMany({
      data: [
        {
          workspaceId: event.workspaceId,
          createdByType: event.actor.type,
          createdById: event.actor.id,
          type: 'DELETED',
          content: `Deal "${event.payload.name}" was deleted.`,
          sourceEventId: event.eventId,
          metadata: {
            dealId: event.payload.id,
            dealName: event.payload.name,
          },
        },
      ],
      skipDuplicates: true,
    });
  },
};
