import { prisma } from '@server/shared/db/client.js';
import { EVENT_NAMES } from '@server/shared/events/contracts/event-types.js';
import type { EventSubscriber } from '@server/shared/events/subscribers/event-subscriber.js';

/**
 * Creates a task timeline activity when a task-created event is processed.
 */
export const taskCreatedSubscriber: EventSubscriber<typeof EVENT_NAMES.TASK_CREATED> = {
  id: 'task-created-activity',
  eventName: EVENT_NAMES.TASK_CREATED,

  async handler(event) {
    await prisma.$transaction(async (tx) => {
      await tx.activity.createMany({
        data: [
          {
            workspaceId: event.workspaceId,
            createdByType: event.actor.type,
            createdById: event.actor.id,
            type: 'CREATED',
            content: `Task "${event.payload.title}" was created.`,
            sourceEventId: event.eventId,
            metadata: {
              taskId: event.payload.id,
              taskTitle: event.payload.title,
              assignedToId: event.payload.assignedToId,
              dueDate: event.payload.dueDate,
              leadId: event.payload.leadId,
              dealId: event.payload.dealId,
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
      }

      if (event.payload.leadId !== null) {
        const lead = await tx.lead.findFirst({
          where: {
            id: event.payload.leadId,
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
      }

      if (event.payload.dealId !== null) {
        const deal = await tx.deal.findFirst({
          where: {
            id: event.payload.dealId,
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
      }
    });
  },
};
