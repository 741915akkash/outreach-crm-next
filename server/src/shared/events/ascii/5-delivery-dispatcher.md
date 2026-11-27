                 PostgreSQL
                      |
                      v
             +-------------------+
             |   EventDelivery   |
             |                   |
             | D1: PENDING       |
             | D2: PENDING       |
             | D3: PENDING       |
             +-------------------+
                      |
                      v
             +-------------------+       File:
             | Delivery          | ----> server/src/shared/events/
             | Dispatcher        |       dispatcher/
             +-------------------+       delivery-dispatcher.ts
                      |
                      | Enqueue jobs
                      v
             +-------------------+       File:
             |      BullMQ       | ----> server/src/shared/events/
             |                   |       queue/
             | Job: D1           |       event-delivery.queue.ts
             | Job: D2           |
             | Job: D3           |
             +-------------------+
                      |
                      v
                Event Worker             File:
                                          server/src/modules/worker/
                                          (worker entry point)



             +-------------------+       File:
             | Dispatcher Worker | ----> server/src/modules/worker/
             |                   |       delivery-dispatcher.worker.ts
             +-------------------+
                      |
                      v
             Delivery Dispatcher
                      |
                      v
                  BullMQ