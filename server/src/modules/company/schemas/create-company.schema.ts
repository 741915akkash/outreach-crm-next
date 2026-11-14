import { z } from 'zod';

const optionalString = z.preprocess((value) => {
  if (value === null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  return value;
}, z.string().trim().max(255).nullable().optional());

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(255),

  website: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z
      .url({ protocol: /^https?$/ })
      .nullable()
      .optional(),
  ),

  industry: optionalString,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  country: optionalString,

  description: z.preprocess((value) => {
    if (value === null || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    return value;
  }, z.string().trim().nullable().optional()),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
