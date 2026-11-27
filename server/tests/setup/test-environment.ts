import 'dotenv/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is not configured.');
}

const databaseUrl = new URL(testDatabaseUrl);

const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, ''));

// Safety guard: tests must never connect to the development database.
if (databaseName !== 'outreach_crm_test') {
  throw new Error(`Unsafe test database: "${databaseName}". Expected "outreach_crm_test".`);
}

// The existing application Prisma client reads DATABASE_URL.
process.env.DATABASE_URL = testDatabaseUrl;
