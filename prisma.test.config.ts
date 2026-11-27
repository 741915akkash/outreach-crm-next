import 'dotenv/config';
import { defineConfig } from 'prisma/config';

if (!process.env['TEST_DATABASE_URL']) {
  throw new Error('TEST_DATABASE_URL is not configured');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['TEST_DATABASE_URL'],
  },
});
