import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a task timeline activity when a task-completed event is processed.
 */
export const taskCompletedSubscriber: EventSubscriber<typeof EVENT_NAMES.TASK_COMPLETED> = {
  id: 'task-completed-activity',
  eventName: EVENT_NAMES.TASK_COMPLETED,

  async handler(event) {
    await prisma.$transaction(async (tx) => {
      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'COMPLETED',
            content: `Task "${event.payload.title}" was completed.`,
            sourceEventId: event.eventId,
            metadata: {
              taskId: event.payload.id,
              taskTitle: event.payload.title,
              completedAt: event.payload.completedAt,
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

      const task = await tx.task.findFirst({
        where: {
          id: event.payload.id,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
          leadId: true,
          dealId: true,
        },
      });

      if (task) {
        await tx.activityTask.createMany({
          data: [
            {
              workspaceId: event.workspaceId,
              activityId: activity.id,
              taskId: task.id,
            },
          ],
          skipDuplicates: true,
        });

        if (task.leadId !== null) {
          await tx.activityLead.createMany({
            data: [
              {
                workspaceId: event.workspaceId,
                activityId: activity.id,
                leadId: task.leadId,
              },
            ],
            skipDuplicates: true,
          });
        }

        if (task.dealId !== null) {
          await tx.activityDeal.createMany({
            data: [
              {
                workspaceId: event.workspaceId,
                activityId: activity.id,
                dealId: task.dealId,
              },
            ],
            skipDuplicates: true,
          });
        }
      }
    });
  },
};
