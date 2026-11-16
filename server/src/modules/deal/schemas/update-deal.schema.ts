import { z } from 'zod';

const positiveInt = z
  .string()
  .regex(/^[1-9]\d*$/, 'Must be a positive integer.')
  .transform(Number)
  .refine(Number.isSafeInteger, 'Value is too large.');

const optionalPositiveInt = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  positiveInt.optional(),
);

const optionalNullablePositiveInt = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  positiveInt.nullable().optional(),
);

const optionalMoney = z.preprocess(
  (value) => (value === null || (typeof value === 'string' && value.trim() === '') ? null : value),
  z
    .string()
    .regex(
      /^(?=.*[1-9])(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/,
      'Value must be greater than zero and have at most 2 decimal places.',
    )
    .nullable()
    .optional(),
);

const optionalCurrency = z.preprocess(
  (value) => (value === null || (typeof value === 'string' && value.trim() === '') ? null : value),
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code.')
    .nullable()
    .optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === null || (typeof value === 'string' && value.trim() === '') ? null : value),
  z.iso.datetime({ offset: true }).nullable().optional(),
);

const optionalDescription = z.preprocess(
  (value) => (value === null || (typeof value === 'string' && value.trim() === '') ? null : value),
  z.string().trim().nullable().optional(),
);

const optionalIdArray = z.array(positiveInt).optional();

export const updateDealSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),

    pipelineId: optionalPositiveInt,
    stageId: optionalPositiveInt,

    companyId: optionalNullablePositiveInt,

    value: optionalMoney,
    currency: optionalCurrency,
    expectedCloseDate: optionalDate,
    description: optionalDescription,

    leadIds: optionalIdArray,
    primaryLeadIds: optionalIdArray,
  })
  .superRefine((data, ctx) => {
    if (Object.values(data).every((value) => value === undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field must be provided.',
      });
    }

    if (data.leadIds && new Set(data.leadIds).size !== data.leadIds.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['leadIds'],
        message: 'Duplicate lead IDs are not allowed.',
      });
    }

    if (data.primaryLeadIds && new Set(data.primaryLeadIds).size !== data.primaryLeadIds.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['primaryLeadIds'],
        message: 'Duplicate primary lead IDs are not allowed.',
      });
    }

    if (data.leadIds !== undefined && data.primaryLeadIds?.some((id) => !data.leadIds!.includes(id))) {
      ctx.addIssue({
        code: 'custom',
        path: ['primaryLeadIds'],
        message: 'Every primary lead must also be included in leadIds.',
      });
    }
  });

export type UpdateDealInput = z.infer<typeof updateDealSchema>;
