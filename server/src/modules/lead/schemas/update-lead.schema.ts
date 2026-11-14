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

const optionalString = z.preprocess((value) => {
  if (value === null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  return value;
}, z.string().trim().max(255).nullable().optional());

export const updateLeadSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),

    email: z.string().trim().max(255).pipe(z.email()).nullable().optional(),

    phone: optionalString,

    companyId: optionalPositiveInt,
    pipelineId: optionalPositiveInt,
    stageId: optionalPositiveInt,
    sourceId: optionalPositiveInt,
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided.',
  });

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
