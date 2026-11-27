                 PostgreSQL
                      |
          +-----------+-----------+
          |                       |
          v                       v
  +------------------+    +-----------------------+
  |  EventDelivery   |    | EventDeliveryAttempt  |
  |                  |    |                       |
  | id               |    | id                    |
  | status           |    | deliveryId            |
  | attempts         |    | attemptNumber         |
  | lockedAt         |    | status                |
  | lockToken        |    | startedAt             |
  | completedAt      |    | completedAt           |
  | lastError        |    | durationMs            |
  +------------------+    | errorMessage          |
          |               | errorStack            |
          | 1             | bullmqJobId            |
          +--------------<| executionType          |
              many       +-----------------------+
