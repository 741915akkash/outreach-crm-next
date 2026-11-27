                  Worker process starts
                           |
                           v
                  registerSubscribers()
                           |
                           v
                Connect PostgreSQL + Redis
                           |
                           v
                 Wait for BullMQ Worker
                           |
                           v
             +-------------+--------------+
             |             |              |
             v             v              v
        Outbox         Delivery       Reconciliation
        Publisher      Dispatcher     Worker
        polling        polling        polling
             |             |              |
             +-------------+--------------+
                           |
                           v
                  SIGINT or SIGTERM
                           |
                           v
                    shutdown(signal)
                           |
                           v
                 AbortController.abort()
                           |
                           v
              Polling loops stop / settle
                           |
                           v
                Promise.allSettled(...)
                           |
                           v
                 Close BullMQ Worker
                           |
                           v
                  Close BullMQ Queue
                           |
                           v
                    Close Redis
                           |
                           v
                  Disconnect Prisma
                           |
                           v
                    Shutdown complete
```

## Signal handling

The worker registers one-time handlers for:

- `SIGINT` — commonly sent when the process is interrupted from a terminal.
- `SIGTERM` — commonly sent by a process manager or container orchestrator when it asks the process to stop.

Both handlers call `shutdown()`. The function guards against repeated shutdown requests and aborts the shared `AbortController`.

## What the AbortController does

The same `AbortSignal` is passed to the Outbox Publisher, Delivery Dispatcher, and Reconciliation polling loops.

Those loops are expected to observe the signal and stop polling. The worker entry point waits for the three loop promises to settle using `Promise.allSettled()`.

The BullMQ event-delivery worker is a separate long-running worker object; it is closed explicitly during cleanup.

## Cleanup order in the current entry point

The `finally` block closes resources in this order:

1. `eventDeliveryWorker.close()`
2. `eventDeliveryQueue.close()`
3. `redisConnection.quit()`
4. `prisma.$disconnect()`

This order closes the BullMQ worker and queue before their Redis connection, then disconnects PostgreSQL.

## Unexpected background-loop failure

`runWorker()` catches an unexpected polling-loop failure, logs it, and calls `shutdown()`. The promise remains rejected, and after the polling promises settle, the entry point rethrows the failure so the process can exit with a non-zero exit code.

Startup failures are also caught by the top-level `startWorker()` handler, which sets `process.exitCode = 1`.

## Important boundary

Graceful shutdown is an orderly shutdown attempt, not a guarantee that every subscriber finishes under every termination condition. A forced process kill, machine failure, or exhausted shutdown deadline can still interrupt execution. The durable delivery state, BullMQ recovery, reconciliation, and subscriber idempotency are what make later recovery possible.

## Key takeaway

The worker entry point coordinates the lifecycle of the background process: initialize dependencies, run polling loops and the BullMQ worker, react to termination signals, wait for polling loops to stop, and close resources in order.
