import z from 'zod';
import { startOfToday } from '@/schemas/utils.ts';

export const routineSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
  date: z
    .date('Date is required')
    .min(startOfToday(), 'Date must be today or later')
    .transform((d) => d.toISOString().slice(0, 10)),
});
