import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { Queue, Worker, type Job } from 'bullmq';

import { afterEach, describe, expect, it } from 'vitest';

interface TestJobData {
  deliveryId: string;
}

const redisUrl = process.env.REDIS_TEST_URL;

if (!redisUrl) {
  throw new Error('REDIS_TEST_URL is not configured.');
}

const redisDatabase = new URL(redisUrl).pathname;

if (redisDatabase !== '/1') {
  throw new Error(`Unsafe Redis test database: "${redisDatabase}". Expected "/1".`);
}

describe('BullMQ Stalled Job Recovery', () => {
  let queue: Queue<TestJobData> | undefined;
  let worker: Worker<TestJobData> | undefined;
  let queueConnection: Redis | undefined;
  let workerConnection: Redis | undefined;

  afterEach(async () => {
    if (worker) {
      await worker.close(true);
      worker = undefined;
    }

    if (queue) {
      await queue.obliterate({ force: true });
      await queue.close();
      queue = undefined;
    }

    await Promise.all([queueConnection?.quit(), workerConnection?.quit()]);

    queueConnection = undefined;
    workerConnection = undefined;
  });

  it('recovers a stalled job and executes it again', async () => {
    const queueName = `crm-stalled-test-${randomUUID()}`;

    queueConnection = new Redis(redisUrl!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    workerConnection = new Redis(redisUrl!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    queue = new Queue<TestJobData>(queueName, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    let executions = 0;
    let notifyFirstExecution!: () => void;

    const firstExecutionStarted = new Promise<void>((resolve) => {
      notifyFirstExecution = resolve;
    });

    let notifyStalled!: (jobId: string) => void;

    const stalledDetected = new Promise<string>((resolve) => {
      notifyStalled = resolve;
    });

    worker = new Worker<TestJobData>(
      queueName,
      async () => {
        executions++;

        if (executions === 1) {
          notifyFirstExecution();

          // Simulate a worker whose processing never finishes.
          return new Promise<never>(() => {});
        }

        return 'recovered-successfully';
      },
      {
        connection: workerConnection,
        concurrency: 2,
        lockDuration: 2000,
        stalledInterval: 1000,
        maxStalledCount: 1,
      },
    );

    worker.on('stalled', (jobId) => {
      notifyStalled(jobId);
    });

    // Prevent an expected old-execution lock error from becoming
    // an unhandled worker error during the simulated recovery.
    worker.on('error', () => {});

    await Promise.all([queue.waitUntilReady(), worker.waitUntilReady()]);

    const completed = new Promise<Job<TestJobData>>((resolve) => {
      worker!.on('completed', (job) => {
        resolve(job);
      });
    });

    const job = await queue.add('stalled-recovery-test', {
      deliveryId: 'stalled-delivery-1',
    });

    await firstExecutionStarted;

    // Simulate the first worker losing its Redis lock.
    await queueConnection!.del(queue.toKey(`${job.id}:lock`));

    const stalledJobId = await Promise.race([
      stalledDetected,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('BullMQ did not detect the stalled job.')), 15_000);
      }),
    ]);

    expect(stalledJobId).toBe(job.id);

    const completedJob = await Promise.race([
      completed,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Recovered job did not complete.')), 15_000);
      }),
    ]);

    expect(executions).toBe(2);
    expect(completedJob.id).toBe(job.id);
    expect(completedJob.returnvalue).toBe('recovered-successfully');

    const storedJob = await queue.getJob(job.id!);

    expect(storedJob).toBeDefined();
    expect(await storedJob!.getState()).toBe('completed');
  }, 30_000);
});
