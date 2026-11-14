import { z } from 'zod';

export const leadParamsSchema = z.object({
  leadId: z
    .string()
    .regex(/^[1-9]\d*$/, 'Lead ID must be a positive integer.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'Lead ID is too large.'),
});

export type LeadParams = z.infer<typeof leadParamsSchema>;
