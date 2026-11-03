import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { prisma } from '@server/db/client';
import { emailVerification } from './email-verification';
import { bootstrapWorkspace } from '@server/services/workspace/bootstrap-workspace';

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
