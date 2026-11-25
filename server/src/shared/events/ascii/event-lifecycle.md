APPLICATION STARTUP
       |
       v
Register Subscribers
       |
       v
   HTTP REQUEST
       |
       v
Business API
       |
       v
PostgreSQL Transaction
       |
       +------> Business Record
       |
       +------> OutboxEvent
                    |
                    v
              Outbox Publisher
                    |
                    v
             Subscriber Registry
                    |
                    v
          Find Matching Subscribers
                    |
                    v
          Create EventDeliveries
                    |
                    v
           Delivery Dispatcher
                    |
                    v
                BullMQ
                    |
                    v
           Event Delivery Worker
                    |
                    v
             Event Processor
                    |
                    +------> Claim Delivery
                    |
                    +------> Create Attempt
                    |
                    +------> Execute Subscriber
                    |
                    +------> Record Outcome
                    |
                    v
                PostgreSQL

       RECONCILIATION runs independently
       to recover inconsistent deliveries.

       GRACEFUL SHUTDOWN controls the
       lifecycle of the entire worker process.