import type { Prisma } from '@/generated/prisma/client.js';

import type { EventName } from '../contracts/event-types.js';
import { subscriberRegistry } from '../subscribers/index.js';

/**
 * Creates one delivery record for each registered subscriber of an event.
 *
 * Uses the database transaction provided by the caller.
 * Existing deliveries are ignored to make the operation idempotent.
 */
export async function createEventDeliveries(
  tx: Prisma.TransactionClient,
  eventId: string,
  eventName: EventName,
): Promise<number> {
  const subscribers = subscriberRegistry.getSubscribers(eventName);

  if (subscribers.length === 0) {
    return 0;
  }

  const result = await tx.eventDelivery.createMany({
    data: subscribers.map((subscriber) => ({
      eventId,
      subscriberId: subscriber.id,
    })),
    skipDuplicates: true,
  });

  return result.count;
}
