import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';

import { prisma } from '@server/shared/db/client.js';

describe('Test database connection', () => {
  beforeAll(async () => {
    const databases = await prisma.$queryRaw<{ databaseName: string }[]>`SELECT current_database() AS "databaseName"`;

    if (databases[0]?.databaseName !== 'outreach_crm_test') {
      throw new Error(`Unsafe database connection: expected outreach_crm_test, got ${databases[0]?.databaseName}`);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('connects to outreach_crm_test', async () => {
    const databases = await prisma.$queryRaw<{ databaseName: string }[]>`SELECT current_database() AS "databaseName"`;

    expect(databases[0]?.databaseName).toBe('outreach_crm_test');
  });

  it('can create and delete an isolated workspace', async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: `Vitest ${randomUUID()}`,
      },
    });

    try {
      const foundWorkspace = await prisma.workspace.findUnique({
        where: { id: workspace.id },
      });

      expect(foundWorkspace).not.toBeNull();
      expect(foundWorkspace?.name).toBe(workspace.name);
    } finally {
      await prisma.workspace.delete({
        where: { id: workspace.id },
      });
    }
  });
});
