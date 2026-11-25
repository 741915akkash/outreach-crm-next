                 BullMQ Worker
                       |
                       | deliveryId
                       v
             +---------------------+       File:
             | Load Delivery       | ----> process-event-delivery.ts
             | and Event           |
             +---------------------+
                       |
                       v
             +---------------------+
             | Check Delivery      |
             | Status              |
             +---------------------+
                       |
                +------+------+
                |             |
            COMPLETED      PENDING
                |             |
                v             v
              Skip       Claim Delivery
                              |
                              v
                    +-------------------+
                    | Execute Subscriber|
                    +-------------------+
                              |
                         +----+----+
                         |         |
                      Success    Failure
                         |         |
                         v         v
                    COMPLETED    FAILED/
                                 RETRY
                         |         |
                         +----+----+
                              |
                              v
                         PostgreSQL


What problem does it solve?
Suppose BullMQ gives the Worker this job:
{
  deliveryId: "delivery_123"
}


The Processor must figure out:
- Does this delivery exist?
- Has it already completed?
- Is it eligible for execution?
- Which event does it belong to?
- Which subscriber should execute?
- Did execution succeed or fail?
- Should it be retried?
The Processor coordinates all of this.

Processor responsibilities
Responsibility	    Purpose
Load delivery	      Retrieve EventDelivery and its event
Validate state	    Avoid executing completed or ineligible deliveries
Claim delivery	    Prevent multiple workers from owning the same delivery
Execute subscriber	Run the registered subscriber logic
Record outcome	    Update status, errors, timestamps
Track attempts	    Maintain delivery execution history
Handle retries	    Make failed deliveries eligible for another attempt