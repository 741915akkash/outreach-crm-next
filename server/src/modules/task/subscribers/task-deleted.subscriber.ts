import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

export const taskDeletedSubscriber: EventSubscriber<typeof EVENT_NAMES.TASK_DELETED> = {
  id: 'task-deleted-activity',
  eventName: EVENT_NAMES.TASK_DELETED,

  async handler(event) {
    await prisma.activity.createMany({
      data: [
        {
          workspaceId: event.workspaceId,
          createdByType: event.actor.type,
          createdById: event.actor.id,
          type: 'DELETED',
          content: `Task "${event.payload.title}" was deleted.`,
          sourceEventId: event.eventId,
          metadata: {
            taskId: event.payload.id,
            taskTitle: event.payload.title,
          },
        },
      ],
      skipDuplicates: true,
    });
  },
};
