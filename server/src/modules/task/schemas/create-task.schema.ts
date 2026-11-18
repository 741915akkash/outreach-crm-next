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
  (value) => (value === null || (typeof value === 'string' && value.trim() === '') ? null : value),
  z.iso.datetime({ offset: true }).nullable().optional(),
);

const optionalDescription = z.preprocess(
  (value) => (value === null || (typeof value === 'string' && value.trim() === '') ? null : value),
  z.string().trim().max(5000).nullable().optional(),
);

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    description: optionalDescription,
    priority: z.enum(['P1', 'P2', 'P3']).optional(),
    dueDate: optionalDate,
    assignedToId: z.string().trim().min(1),
    leadId: optionalPositiveInt,
    dealId: optionalPositiveInt,
    visibility: z.enum(['EVERYONE', 'PRIVATE']).optional(),
  })
  .strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
