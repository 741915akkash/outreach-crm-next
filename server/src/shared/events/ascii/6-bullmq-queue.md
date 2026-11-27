       Delivery Dispatcher
                |
                | add job
                | jobId = delivery-{deliveryId}
                v
       +-----------------------+
       |      BullMQ Queue     | ----> server/src/shared/events/queue/
       |                       |       event-delivery.queue.ts
       | Job name:             |
       | process-event-delivery|
       |                       |
       | Data:                 |
       | { deliveryId }        |
       +-----------------------+
                |
                | job becomes available
                v
       +-----------------------+
       |    BullMQ Worker      | ----> server/src/modules/worker/
       |                       |       event-delivery.worker.ts
       +-----------------------+
