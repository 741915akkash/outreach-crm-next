             OUTBOX PUBLISHER WORKER
                       |
                       v
              +----------------------+
              |   Polling Loop       | ----> modules/worker/
              |                      |       outbox-publisher.worker.ts
              +----------------------+
                       |
                       v
              +----------------------+
              |   Outbox Publisher   | ----> shared/events/
              |                      |       publisher/outbox-publisher.ts
              +----------------------+
                       |
                       v
              +----------------------+
              | Find Unpublished     |
              | Outbox Events        |
              +----------------------+
                       |
                       v
              +----------------------+
              | Identify Subscribers | ----> subscribers/
              |                      |       subscriber-registry.ts
              +----------------------+
                       |
                       v
              +-----------------------------+
              |    PostgreSQL Transaction   |
              |                             |
              |          BEGIN              |
              |            |                |
              |            v                |
              |   +--------------------+    |
              |   | Create Event       |    | --> deliveries/
              |   | Deliveries         |    |     create-event-deliveries.ts
              |   +--------------------+    |
              |            |                |
              |            v                |
              |   +--------------------+    |
              |   | Mark Outbox Event  |    |
              |   | as Published       |    |
              |   +--------------------+    |
              |            |                |
              |            v                |
              |          COMMIT             |
              +-----------------------------+
                       |
                       v
              +----------------------+
              | Event Deliveries     |
              | Ready for Dispatch   |
              +----------------------+

              