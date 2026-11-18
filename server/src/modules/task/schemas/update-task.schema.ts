import { z } from 'zod';

const optionalPositiveInt = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'Value is too large.')
    .nullable()
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

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: optionalDescription,
    priority: z.enum(['P1', 'P2', 'P3']).optional(),
    dueDate: optionalDate,
    assignedToId: z.string().trim().min(1).optional(),
    leadId: optionalPositiveInt,
    dealId: optionalPositiveInt,
    visibility: z.enum(['EVERYONE', 'PRIVATE']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided.',
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
