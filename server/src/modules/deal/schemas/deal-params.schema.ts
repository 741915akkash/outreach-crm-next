import { z } from 'zod';

export const dealParamsSchema = z.object({
  dealId: z
    .string()
    .regex(/^[1-9]\d*$/, 'Deal ID must be a positive integer.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'Deal ID is too large.'),
});

export type DealParams = z.infer<typeof dealParamsSchema>;
