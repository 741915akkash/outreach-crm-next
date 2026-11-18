import { z } from 'zod';

const optionalPositiveInt = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'Value is too large.')
    .optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z.iso.datetime({ offset: true }).optional(),
);

export const listTasksQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),

    search: z.string().trim().max(200).optional(),

    assignedToId: z.string().trim().min(1).optional(),
    createdById: z.string().trim().min(1).optional(),

    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['P1', 'P2', 'P3']).optional(),
    visibility: z.enum(['EVERYONE', 'PRIVATE']).optional(),

    leadId: optionalPositiveInt,
    dealId: optionalPositiveInt,

    dueDateFrom: optionalDate,
    dueDateTo: optionalDate,

    sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'updatedAt']).default('dueDate'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
  .superRefine((query, ctx) => {
    if (query.dueDateFrom && query.dueDateTo && new Date(query.dueDateFrom) > new Date(query.dueDateTo)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dueDateTo'],
        message: 'dueDateTo must be later than or equal to dueDateFrom.',
      });
    }
  });

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
