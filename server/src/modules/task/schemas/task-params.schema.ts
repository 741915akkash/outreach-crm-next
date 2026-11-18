import { z } from 'zod';

export const taskParamsSchema = z.object({
  taskId: z
    .string()
    .regex(/^[1-9]\d*$/, 'Task ID must be a positive integer.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'Task ID is too large.'),
});

export type TaskParams = z.infer<typeof taskParamsSchema>;
