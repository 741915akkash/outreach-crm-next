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

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(255),

  email: z.string().trim().pipe(z.email()).optional().nullable(),

  phone: optionalString,

  companyId: optionalPositiveInt,
  pipelineId: optionalPositiveInt,
  stageId: optionalPositiveInt,
  sourceId: optionalPositiveInt,
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
