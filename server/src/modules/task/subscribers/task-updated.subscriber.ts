import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

export const taskUpdatedSubscriber: EventSubscriber<typeof EVENT_NAMES.TASK_UPDATED> = {
  id: 'task-updated-activity',
  eventName: EVENT_NAMES.TASK_UPDATED,

  async handler(event) {
    // Completion has its own COMPLETED activity.
    // Exclude status and completedAt to avoid duplicate activities.
    const changes = Object.fromEntries(
      Object.entries(event.payload.changes).filter(([key]) => key !== 'status' && key !== 'completedAt'),
    );

    if (Object.keys(changes).length === 0) return;

    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: {
          id: event.payload.id,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
          title: true,
          leadId: true,
          dealId: true,
        },
      });

      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'UPDATED',
            content: `Task "${event.payload.changes.title ?? task?.title ?? 'Task'}" was updated.`,
            sourceEventId: event.eventId,
            metadata: {
              taskId: event.payload.id,
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
