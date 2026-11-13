import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { prisma } from '@server/shared/db/client.js';
import { emailVerification } from './email-verification.js';
import { bootstrapWorkspace } from '@server/modules/workspace/services/bootstrap-workspace.js';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  emailVerification,

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await bootstrapWorkspace({
            userId: user.id,
            userName: user.name,
          });
        },
      },
    },
  },
});
