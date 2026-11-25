              APPLICATION STARTUP
                      |
                      v
          +-------------------------+
          |  registerSubscribers()  | ----> modules/worker/
          |                         |       bootstrap/
          +-------------------------+       register-subscribers.ts
                      |
                      |
          +-----------+-----------+
          |                       |
          v                       v
 +-------------------+   +-------------------+
 | Subscriber A      |   | Subscriber B      |
 |                   |   |                   |
 +-------------------+   +-------------------+
          |                       |
          +-----------+-----------+
                      |
                      v
          +-------------------------+
          |   Subscriber Registry   | ----> shared/events/
          |                         |       subscribers/
          |                         |       subscriber-registry.ts
          +-------------------------+
                      ^
                      |
                      |
          +-------------------------+
          |     Outbox Publisher    |
          |                         |
          +-------------------------+
                      |
                      v
          +-------------------------+
          | Find Subscribers for    |
          | company.created         |
          +-------------------------+
                      |
                      v
          +-------------------------+
          | Return Matching         |
          | Subscribers             |
          +-------------------------+
          