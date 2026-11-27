# Event Subscriber Conventions

## 1. Purpose

Event subscribers execute side effects when domain events are delivered.

A subscriber may execute more than once because of:

- BullMQ retries.
- Worker crashes.
- Stalled-job recovery.
- Duplicate job execution.
- Failure to persist delivery success after the subscriber has completed.

Therefore, every subscriber must be designed to be **idempotent**.

Idempotency means that processing the same event multiple times produces the same business outcome as processing it once.

## 2. Core principles

All subscribers should follow these conventions:

1. Use `event.eventId` as the stable identity of the originating event.
2. Enforce idempotency using database constraints wherever possible.
3. Use `skipDuplicates: true` for insert-if-absent operations when appropriate.
4. Wrap related database operations in a Prisma transaction.
5. Never rely on BullMQ job IDs or attempt numbers for business-level idempotency.
6. Handle external side effects separately using provider-supported idempotency keys or dedicated side-effect tracking.

PostgreSQL is the source of truth for business data and idempotency constraints.

## 3. Database idempotency

### 3.1 Unique event identity

When a subscriber creates an activity from an event, use `event.eventId` as its `sourceEventId`.

Example:

```prisma
model Activity {
  id            Int     @id @default(autoincrement())
  sourceEventId String? @unique
}
```

This ensures that one event cannot create multiple event-generated activities.

The field is nullable because manually created activities do not necessarily originate from an event.

### 3.2 Association idempotency

Association tables should have appropriate unique constraints.

Example:

```prisma
model ActivityCompany {
  workspaceId String
  activityId  Int
  companyId    Int

  @@id([workspaceId, activityId, companyId])
  @@unique([activityId, companyId])
}
```

These constraints prevent duplicate associations.

Always verify that the actual database schema enforces the intended uniqueness.

## 4. Database subscriber pattern

For subscribers that perform multiple related database operations:

- Use a Prisma transaction.
- Create records using stable event identity.
- Retrieve existing records when necessary.
- Create associations using duplicate-safe inserts.
- Allow failures to propagate to the event processor.

Example:

```ts
async handler(event) {
  await prisma.$transaction(async (tx) => {
    await tx.activity.createMany({
      data: [
        {
          workspaceId: event.workspaceId,
          createdByType: event.actor.type,
          createdById: event.actor.id,
          type: 'CREATED',
          content: 'A record was created.',
          sourceEventId: event.eventId,
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
      throw new Error(
        `Could not find activity for event "${event.eventId}".`,
      );
    }

    // Create related associations using duplicate-safe inserts.
  });
}
```

This is a general pattern. Adapt it to the actual event payload and domain model.

## 5. Existing implementation: Company Created

The `companyCreatedSubscriber` is our reference implementation.

File:

`server/src/modules/company/subscribers/company-created.subscriber.ts`

Its execution:

1. Creates an activity using `event.eventId` as `sourceEventId`.
2. Uses `skipDuplicates: true` to avoid duplicate activity creation.
3. Retrieves the existing activity using `sourceEventId`.
4. Creates the ActivityCompany association.
5. Uses `skipDuplicates: true` for the association.
6. Wraps the operations in a single PostgreSQL transaction.

This provides database-level idempotency for the activity and its company association.

## 6. External side effects

Database idempotency does not automatically guarantee idempotency for external services.

Examples:

- Sending emails.
- Calling third-party APIs.
- Sending webhooks.
- Triggering external workflows.

Consider this execution:

1. Subscriber sends an email successfully.
2. Worker crashes before recording delivery success.
3. BullMQ retries the job.
4. Subscriber executes again.

Without additional protection, the email could be sent twice.

For external side effects, use one of these approaches:

- Provider-supported idempotency keys, preferably based on a stable event and side-effect identity.
- A dedicated side-effect tracking table with unique constraints.
- An outbox-based delivery mechanism for independently managed external operations.

Do not assume that wrapping an external API call in a Prisma transaction makes it atomic with PostgreSQL.

## 7. Error handling

Subscribers should throw errors when their required work fails.

The event processor is responsible for recording the delivery outcome and propagating failures to BullMQ.

Avoid swallowing errors:

```ts
try {
  await performOperation();
} catch (error) {
  console.error(error);
  // Do not silently swallow the error.
  throw error;
}
```

Expected business conditions, such as a related record no longer existing, should have explicitly defined behavior rather than accidental success or failure.

## 8. Subscriber implementation checklist

Before registering a new subscriber, verify:

- [ ] Subscriber has a stable, unique subscriber ID.
- [ ] Subscriber is registered for the correct event.
- [ ] `event.eventId` is used for event-level idempotency.
- [ ] Database unique constraints protect duplicate inserts.
- [ ] Related database operations use a transaction.
- [ ] Association creation is idempotent.
- [ ] External side effects have their own idempotency strategy.
- [ ] Errors propagate to the event processor.
- [ ] Duplicate execution does not create duplicate business effects.

## 9. Responsibility boundaries

| Component       | Responsibility                                                            |
| --------------- | ------------------------------------------------------------------------- |
| PostgreSQL      | Business data, uniqueness constraints, delivery state and attempt history |
| BullMQ          | Job execution, concurrency, retry scheduling and stalled-job recovery     |
| Event processor | Claim delivery, invoke subscriber and persist execution outcome           |
| Subscriber      | Execute event-specific business logic idempotently                        |

Subscribers should not manage BullMQ retries or directly manipulate delivery state.

---

**Core rule: Design every subscriber assuming that the same event can be delivered and executed more than once.**

