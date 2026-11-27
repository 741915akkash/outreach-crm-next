        BUSINESS TRANSACTION
                 |
                 v

+-------------------------------+
| companies                     |
| ----------------------------- |
| id: 101                       |
| name: Acme Technologies       |
| workspaceId: ws_123           |
| +---------------------------+ |

                 |
                 | Same PostgreSQL transaction
                 | Creates business record + event
                 v

+------------------------------------+
| outbox_events                      |
| ---------------------------------- |
| eventId: evt_001                   |
| eventName: company.created         |
| workspaceId: ws_123                |
| entityChanged.type: COMPANY        |
| entityChanged.id: 101              |
| actor: USER                        |
| payload: {...}                     |
| publishedAt: ...                   |
| +--------------------------------+ |

                 |
                 | 1 event
                 | Outbox Publisher
                 | finds 3 subscribers
                 v
       +-------------------------+
       |     event_deliveries    |
       |-------------------------|
       |                         |
       | Delivery D1             |
       | eventId: evt_001        |
       | subscriberId: activity  |
       | status: SUCCEEDED       |
       | attempts: 1             |
       |                         |
       | Delivery D2             |
       | eventId: evt_001        |
       | subscriberId: webhook   |
       | status: PENDING         |
       | attempts: 2             |
       |                         |
       | Delivery D3             |
       | eventId: evt_001        |
       | subscriberId: notify    |
       | status: FAILED          |
       | attempts: 5             |
       +-------------------------+
                 |
                 | Each delivery has its own
                 | execution history
                 v
       +-----------------------------+
       |    event_delivery_attempts  |
       |-----------------------------|
       |                             |
       | D1                          |
       | Attempt 1: SUCCEEDED        |
       |                             |
       | D2                          |
       | Attempt 1: FAILED           |
       | Attempt 2: PROCESSING       |
       |                             |
       | D3                          |
       | Attempt 1: FAILED           |
       | Attempt 2: FAILED           |
       | Attempt 3: FAILED           |
       | Attempt 4: FAILED           |
       | Attempt 5: FAILED           |
       +-----------------------------+
