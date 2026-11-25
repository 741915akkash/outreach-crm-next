                  BullMQ
                     |
                     | Job available
                     v
             +-------------------+       File:
             | Event Delivery    | ----> server/src/modules/worker/
             | Worker            |       (worker entry point)
             +-------------------+
                     |
                     | Receives deliveryId
                     v
             +-------------------+       File:
             | Event Processor   | ----> server/src/shared/events/
             |                   |       processor/
             +-------------------+       process-event-delivery.ts
                     |
                     v
             +-------------------+
             | PostgreSQL        |
             |                   |
             | EventDelivery     |
             | Event             |
             +-------------------+
                     |
                     v
             Execute Subscriber

The Delivery Dispatcher puts jobs into BullMQ, but BullMQ doesn't execute your CRM business logic itself.

We need a Worker that:
1. Listens for jobs in the BullMQ queue.
2. Picks up a job when it becomes available.
3. Passes the delivery information to the event processor.
4. Handles the result returned by the processor.