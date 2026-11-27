import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    $connect: vi.fn(),
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  },
  redisConnection: {
    ping: vi.fn(),
    quit: vi.fn(),
  },
  eventDeliveryQueue: {
    close: vi.fn(),
  },
  eventDeliveryWorker: {
    waitUntilReady: vi.fn(),
    close: vi.fn(),
  },
  registerSubscribers: vi.fn(),
  runOutboxPublisherWorker: vi.fn(),
  runDeliveryDispatcherWorker: vi.fn(),
  runDeliveryReconciliationWorker: vi.fn(),
}));

vi.mock('@server/shared/db/client.js', () => ({
  prisma: mocks.prisma,
}));

vi.mock('@server/shared/queue/index.js', () => ({
  redisConnection: mocks.redisConnection,
}));

vi.mock('@server/shared/events/queue/index.js', () => ({
  eventDeliveryQueue: mocks.eventDeliveryQueue,
}));

vi.mock('@server/modules/worker/bootstrap/register-subscribers.js', () => ({
  registerSubscribers: mocks.registerSubscribers,
}));

vi.mock('@server/modules/worker/outbox-publisher.worker.js', () => ({
  runOutboxPublisherWorker: mocks.runOutboxPublisherWorker,
}));

vi.mock('@server/modules/worker/delivery-dispatcher.worker.js', () => ({
  runDeliveryDispatcherWorker: mocks.runDeliveryDispatcherWorker,
}));

vi.mock('@server/modules/worker/reconciliation.worker.js', () => ({
  runDeliveryReconciliationWorker: mocks.runDeliveryReconciliationWorker,
}));

vi.mock('@server/modules/worker/event-delivery.worker.js', () => ({
  eventDeliveryWorker: mocks.eventDeliveryWorker,
}));

const signalHandlers = new Map<string, () => void>();

function waitForAbort(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    signal.addEventListener('abort', () => resolve(), { once: true });
  });
}

async function importWorker(): Promise<void> {
  await import('@server/modules/worker/index.js');
}

async function waitForCleanup(): Promise<void> {
  await vi.waitFor(() => {
    expect(mocks.prisma.$disconnect).toHaveBeenCalledOnce();
  });
}

function expectAllResourcesClosed(): void {
  expect(mocks.eventDeliveryWorker.close).toHaveBeenCalledOnce();
  expect(mocks.eventDeliveryQueue.close).toHaveBeenCalledOnce();
  expect(mocks.redisConnection.quit).toHaveBeenCalledOnce();
  expect(mocks.prisma.$disconnect).toHaveBeenCalledOnce();
}

describe('Main Worker Lifecycle', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.exitCode = 0;
    signalHandlers.clear();

    vi.stubEnv('OUTBOX_POLL_INTERVAL_MS', '10');
    vi.stubEnv('RECONCILIATION_POLL_INTERVAL_MS', '20');

    vi.spyOn(process, 'once').mockImplementation(((event: string | symbol, listener: (...args: never[]) => void) => {
      if (event === 'SIGINT' || event === 'SIGTERM') {
        signalHandlers.set(event, listener as () => void);
      }

      return process;
    }) as typeof process.once);

    mocks.prisma.$connect.mockResolvedValue(undefined);
    mocks.prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mocks.prisma.$disconnect.mockResolvedValue(undefined);

    mocks.redisConnection.ping.mockResolvedValue('PONG');
    mocks.redisConnection.quit.mockResolvedValue('OK');

    mocks.eventDeliveryQueue.close.mockResolvedValue(undefined);
    mocks.eventDeliveryWorker.waitUntilReady.mockResolvedValue(undefined);
    mocks.eventDeliveryWorker.close.mockResolvedValue(undefined);

    mocks.registerSubscribers.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.exitCode = 0;
    signalHandlers.clear();
  });

  it.each(['SIGINT', 'SIGTERM'] as const)('gracefully shuts down after %s', async (signalName) => {
    const signals: AbortSignal[] = [];

    const pollingWorker = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return waitForAbort(signal);
    });

    mocks.runOutboxPublisherWorker.mockImplementation(pollingWorker);
    mocks.runDeliveryDispatcherWorker.mockImplementation(pollingWorker);
    mocks.runDeliveryReconciliationWorker.mockImplementation(pollingWorker);

    await importWorker();

    await vi.waitFor(() => {
      expect(mocks.runOutboxPublisherWorker).toHaveBeenCalledOnce();
      expect(mocks.runDeliveryDispatcherWorker).toHaveBeenCalledOnce();
      expect(mocks.runDeliveryReconciliationWorker).toHaveBeenCalledOnce();
    });

    expect(mocks.registerSubscribers).toHaveBeenCalledOnce();
    expect(mocks.prisma.$connect).toHaveBeenCalledOnce();
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(mocks.redisConnection.ping).toHaveBeenCalledOnce();
    expect(mocks.eventDeliveryWorker.waitUntilReady).toHaveBeenCalledOnce();

    expect(signals).toHaveLength(3);

    signalHandlers.get(signalName)?.();

    await waitForCleanup();

    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expectAllResourcesClosed();
    expect(process.exitCode).toBe(0);

    expect(mocks.eventDeliveryWorker.close.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.eventDeliveryQueue.close.mock.invocationCallOrder[0],
    );

    expect(mocks.eventDeliveryQueue.close.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.redisConnection.quit.mock.invocationCallOrder[0],
    );

    expect(mocks.redisConnection.quit.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.prisma.$disconnect.mock.invocationCallOrder[0],
    );
  });

  it('shuts down all polling workers when one fails', async () => {
    const signals: AbortSignal[] = [];

    mocks.runOutboxPublisherWorker.mockRejectedValue(new Error('Outbox publisher failed'));

    const waitForShutdown = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return waitForAbort(signal);
    });

    mocks.runDeliveryDispatcherWorker.mockImplementation(waitForShutdown);
    mocks.runDeliveryReconciliationWorker.mockImplementation(waitForShutdown);

    await importWorker();

    await waitForCleanup();

    expect(mocks.runOutboxPublisherWorker).toHaveBeenCalledOnce();
    expect(mocks.runDeliveryDispatcherWorker).toHaveBeenCalledOnce();
    expect(mocks.runDeliveryReconciliationWorker).toHaveBeenCalledOnce();

    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);

    expectAllResourcesClosed();
    expect(process.exitCode).toBe(1);
  });

  it('attempts every cleanup operation when startup fails', async () => {
    mocks.prisma.$connect.mockRejectedValue(new Error('PostgreSQL unavailable'));

    mocks.eventDeliveryWorker.close.mockRejectedValue(new Error('Worker close failed'));

    await importWorker();

    await waitForCleanup();

    expect(mocks.registerSubscribers).toHaveBeenCalledOnce();
    expect(mocks.prisma.$connect).toHaveBeenCalledOnce();

    expect(mocks.prisma.$queryRaw).not.toHaveBeenCalled();
    expect(mocks.redisConnection.ping).not.toHaveBeenCalled();
    expect(mocks.eventDeliveryWorker.waitUntilReady).not.toHaveBeenCalled();

    expectAllResourcesClosed();
    expect(process.exitCode).toBe(1);
  });


it('cleans up when Redis startup fails', async () => {
  mocks.redisConnection.ping.mockRejectedValue(new Error('Redis unavailable'));

  await importWorker();

  await waitForCleanup();

  expect(mocks.prisma.$connect).toHaveBeenCalledOnce();
  expect(mocks.prisma.$queryRaw).toHaveBeenCalledOnce();
  expect(mocks.redisConnection.ping).toHaveBeenCalledOnce();
  expect(mocks.eventDeliveryWorker.waitUntilReady).not.toHaveBeenCalled();

  expectAllResourcesClosed();
  expect(process.exitCode).toBe(1);
});

it('cleans up when BullMQ worker readiness fails', async () => {
  mocks.eventDeliveryWorker.waitUntilReady.mockRejectedValue(new Error('BullMQ unavailable'));

  await importWorker();

  await waitForCleanup();

  expect(mocks.prisma.$connect).toHaveBeenCalledOnce();
  expect(mocks.redisConnection.ping).toHaveBeenCalledOnce();
  expect(mocks.eventDeliveryWorker.waitUntilReady).toHaveBeenCalledOnce();

  expectAllResourcesClosed();
  expect(process.exitCode).toBe(1);
});

});
