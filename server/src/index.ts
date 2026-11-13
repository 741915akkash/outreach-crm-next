import app from './app.js';
import { prisma } from './shared/db/client.js';

const PORT = Number(process.env.PORT) || 7000;

async function startServer() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    console.log('PostgreSQL connected successfully.');

    app.listen(PORT, () => {
      console.log(`Outreach CRM API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Outreach CRM API:', error);

    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

void startServer();
