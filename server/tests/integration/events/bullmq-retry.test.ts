import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { Queue, Worker, type Job } from 'bullmq';

import { afterEach, describe, expect, it } from 'vitest';

interface TestJobData {
  deliveryId: string;
}

interface TestQueueResources {
  queue: Queue<TestJobData>;
  worker: Worker<TestJobData>;
  close: () => Promise<void>;
}

const redisUrl = process.env.REDIS_TEST_URL;

if (!redisUrl) {
  throw new Error('REDIS_TEST_URL is not configured.');
}

const redisDatabase = new URL(redisUrl).pathname;

if (redisDatabase !== '/1') {
  throw new Error(`Unsafe Redis test database: "${redisDatabase}". Expected "/1".`);
}

async function createTestQueue(processor: (job: Job<TestJobData>) => Promise<unknown>): Promise<TestQueueResources> {
  const queueName = `crm-event-deliveries-test-${randomUUID()}`;

  const queueConnection = new Redis(redisUrl!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  const workerConnection = new Redis(redisUrl!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  const queue = new Queue<TestJobData>(queueName, {
    connection: queueConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 100,
      },
      removeOnComplete: false,
      removeOnFail: false,
    },
  });

  const worker = new Worker<TestJobData>(queueName, processor, {
    connection: workerConnection,
    concurrency: 1,
    lockDuration: 5000,
    stalledInterval: 5000,
    maxStalledCount: 1,
  });

  await Promise.all([queue.waitUntilReady(), worker.waitUntilReady()]);

  return {
    queue,
    worker,

    close: async () => {
      await worker.close();
      await queue.obliterate({ force: true });
      await queue.close();

      await Promise.all([queueConnection.quit(), workerConnection.quit()]);
    },
  };
}

function waitForEvent<T>(promise: Promise<T>, timeoutMs = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`BullMQ event timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

describe('BullMQ Retry Integration', () => {
  let resources: TestQueueResources | undefined;

  afterEach(async () => {
    if (resources) {
      await resources.close();
      resources = undefined;
    }
  });

  it('retries a failed job and eventually completes it', async () => {
    let executions = 0;
    const executionTimes: number[] = [];

    resources = await createTestQueue(async () => {
      executions++;
      executionTimes.push(Date.now());

      if (executions === 1) {
        throw new Error('Temporary failure');
      }

      return { success: true };
    });

    const completed = new Promise<Job<TestJobData>>((resolve) => {
      resources!.worker.on('completed', (job) => {
        resolve(job);
      });
    });

    const job = await resources.queue.add(
      'retry-test',
      { deliveryId: 'test-delivery-1' },
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 200,
        },
      },
    );

    const completedJob = await waitForEvent(completed);

    expect(executions).toBe(2);
    expect(completedJob.id).toBe(job.id);
    expect(completedJob.returnvalue).toEqual({ success: true });
    expect(completedJob.attemptsMade).toBe(2);

    expect(executionTimes[1]! - executionTimes[0]!).toBeGreaterThanOrEqual(150);

    expect(await completedJob.getState()).toBe('completed');
  });

  it('marks a job as failed after exhausting all attempts', async () => {
    let executions = 0;

    resources = await createTestQueue(async () => {
      executions++;
      throw new Error('Permanent failure');
    });

    const failed = new Promise<{
      job: Job<TestJobData>;
      error: Error;
    }>((resolve) => {
      resources!.worker.on('failed', (job, error) => {
        if (job && job.attemptsMade >= 2) {
          resolve({ job, error });
        }
      });
    });

    const job = await resources.queue.add(
      'exhausted-retry-test',
      { deliveryId: 'test-delivery-2' },
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 100,
        },
      },
    );

    const result = await waitForEvent(failed);

    expect(executions).toBe(2);
    expect(result.job.id).toBe(job.id);
    expect(result.error.message).toBe('Permanent failure');
    expect(result.job.attemptsMade).toBe(2);
    expect(await result.job.getState()).toBe('failed');
  });

  it('retains failed jobs when removeOnFail is false', async () => {
    resources = await createTestQueue(async () => {
      throw new Error('Retain failed job');
    });

    const failed = new Promise<Job<TestJobData>>((resolve) => {
      resources!.worker.on('failed', (job) => {
        if (job && job.attemptsMade >= 1) {
          resolve(job);
        }
      });
    });

    const job = await resources.queue.add(
      'retained-failure-test',
      { deliveryId: 'test-delivery-3' },
      {
        attempts: 1,
        removeOnFail: false,
      },
    );

    const failedJob = await waitForEvent(failed);

    expect(failedJob.id).toBe(job.id);

    const storedJob = await resources.queue.getJob(job.id!);

    expect(storedJob).toBeDefined();
    expect(await storedJob!.getState()).toBe('failed');
  });
});
