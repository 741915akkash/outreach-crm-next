import { z } from 'zod';

export const companyParamsSchema = z.object({
  companyId: z
    .string()
    .regex(/^[1-9]\d*$/, 'Company ID must be a positive integer.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'Company ID is too large.'),
});

export type CompanyParams = z.infer<typeof companyParamsSchema>;
