                 RECONCILIATION WORKER
                         |
                         | Every 30 seconds
                         v
              +------------------------+
              | reconcileEventDeliveries() |
              +------------------------+
                         |
                         v
              +------------------------+
              | PostgreSQL             |
              | Find PROCESSING        |
              | deliveries older than  |
              | 90 seconds              |
              +------------------------+
                         |
                         v
              +------------------------+
              | Get BullMQ Job         |
              |                        |
              | ID: delivery-{id}      |
              +------------------------+
                         |
               +---------+---------+
               |         |         |
               v         v         v
            Missing   COMPLETED   FAILED
               |         |         |
               v         v         v
           Recover    Recover    Mark delivery
           delivery   delivery   FAILED
               |         |
               v         v
           PENDING    PENDING
               |         |
               |      Remove old job
               |         |
               +----+----+
                    |
                    v
              Dispatcher can
              enqueue again


//////////////////////////////////////////////////////////
              ACTIVE / WAITING / DELAYED
                         |
                         v
                       SKIP
                Let BullMQ handle it
////////////////////////////////////////////////////////////

              PostgreSQL
                   |
                   v
          Find due PENDING deliveries
                   |
                   v
             Get BullMQ Job
                   |
          +--------+---------+
          |        |         |
          v        v         v
       Missing  COMPLETED  FAILED
          |        |         |
          v        v         v
       Skip     Remove    Mark delivery
       (let      old job   FAILED
       dispatcher
       enqueue)

Scenario A: Worker A is still healthy
- Worker A renews its PostgreSQL lease.
- Worker B receives a duplicate BullMQ job.
- Worker B cannot claim the PROCESSING delivery.
- Worker B exits without executing the subscriber.
- Reconciliation sees a fresh lockedAt and leaves the delivery alone.
- Worker A eventually completes.


Scenario B: Worker A crashes
- Worker A stops renewing its lease.
- lockedAt becomes stale after 90 seconds.
- Reconciliation checks the BullMQ job.
- Once the job is no longer active and is in a recoverable state, reconciliation resets the delivery to PENDING.
- The dispatcher can enqueue it again.
- Worker B claims it with a new token.