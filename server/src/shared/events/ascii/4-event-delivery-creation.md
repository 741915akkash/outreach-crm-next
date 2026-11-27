                 OUTBOX PUBLISHER
                        |
                        v
              +---------------------+
              |  OutboxEvent        |
              |                     |
              |  eventId: evt_123   |
              |  eventName:         |
              |  company.created    |
              +---------------------+
                        |
                        v
              +--------------------------+
              | createEventDeliveries()  | ----> File:
              |                          |       deliveries/
              |                          |       create-event-deliveries.ts
              +--------------------------+
                        |
                        v
              +---------------------+
              | Subscriber Registry |
              |                     |
              +---------------------+
                        |
                        v
              +---------------------+
              | Matching Subscribers|
              +---------------------+
                        |
                        v
              +-----------------------------+
              |     For Each Subscriber     |
              |                             |
              |  +----------------------+   |
              |  | Create Delivery A    |   |
              |  +----------------------+   |
              |             |               |
              |  +----------------------+   |
              |  | Create Delivery B    |   |
              |  +----------------------+   |
              |             |               |
              |  +----------------------+   |
              |  | Create Delivery C    |   |
              |  +----------------------+   |
              +-----------------------------+
                        |
                        v
              +-----------------------------+
              |          PostgreSQL         |
              |                             |
              |  EventDelivery A             |
              |  subscriber: activity       |
              |  status: PENDING             |
              |                             |
              |  EventDelivery B             |
              |  subscriber: webhook        |
              |  status: PENDING             |
              |                             |
              |  EventDelivery C             |
              |  subscriber: notification   |
              |  status: PENDING             |
              +-----------------------------+
