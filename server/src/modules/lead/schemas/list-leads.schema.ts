import { z } from 'zod';

const optionalPositiveInt = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'Value is too large.'),
);

const optionalDate = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z.iso.datetime({ offset: true }),
);

export const listLeadsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),

    search: z.string().trim().max(200).optional(),

    companyId: optionalPositiveInt.optional(),
    pipelineId: optionalPositiveInt.optional(),
    stageId: optionalPositiveInt.optional(),
    sourceId: optionalPositiveInt.optional(),

    createdFrom: optionalDate.optional(),
    createdTo: optionalDate.optional(),

    sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .superRefine((query, ctx) => {
    if (query.createdFrom && query.createdTo && new Date(query.createdFrom) > new Date(query.createdTo)) {
      ctx.addIssue({
        code: 'custom',
        path: ['createdTo'],
        message: 'createdTo must be later than or equal to createdFrom.',
      });
    }
  });

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
