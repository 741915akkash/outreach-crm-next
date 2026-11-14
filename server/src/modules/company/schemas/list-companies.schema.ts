import { z } from 'zod';

export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),

  search: z.string().trim().max(200).optional(),

  industry: z.string().trim().optional(),
  country: z.string().trim().optional(),

  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
