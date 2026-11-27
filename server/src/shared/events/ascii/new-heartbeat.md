                 Worker A
                    |
                    v
              Claim Delivery
                    |
                    v
              PROCESSING
                    |
             +------+------+
             |             |
             v             v
         Heartbeat     Subscriber
             |          Execution
             |             |
             v             v
        Update lease    Complete
             |             |
             +-------------+
                    |
                    v
                PostgreSQL


             If heartbeat stops
                    |
                    v
              Reconciliation
                    |
                    v
            Check BullMQ state
                    |
                    v
            Recover stale delivery
                    |
                    v
                 PENDING
                    |
                    v
              Dispatcher
                    |
                    v
                 Worker B