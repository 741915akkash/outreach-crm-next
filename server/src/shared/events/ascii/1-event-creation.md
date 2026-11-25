                  HTTP REQUEST
                       |
                       v
              +------------------+       File:
              |   Company API    | ----> company/routes/...
              |   Route Handler  |       Function: route handler
              +------------------+
                       |
                       v
              +------------------+       File:
              |  createCompany() | ----> company/services/
              |     Service      |       create-company.ts
              +------------------+
                       |
                       v
              +--------------------------+
              |    Prisma Transaction    |       File:
              |                          | ----> create-company.ts
              |       BEGIN              |
              |         |                |
              |         v                |
              |  +-------------------+   |       Operation:
              |  | Create Company    |   | ----> tx.company.create()
              |  +-------------------+   |
              |         |                |
              |         v                |
              |  +-------------------+   |       Operation:
              |  | Create Outbox     |   | ----> tx.outboxEvent.create()
              |  | Event             |   |
              |  +-------------------+   |
              |         |                |
              |         v                |
              |       COMMIT             |
              +--------------------------+
                       |
              +--------+--------+
              |                 |
              v                 v
       +-------------+   +----------------+
       | Company     |   | OutboxEvent    |
       | Table       |   | Table          |
       +-------------+   +----------------+