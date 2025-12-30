import { format } from 'date-fns';
import z from 'zod';
import { startOfToday } from '@/lib/utils';

export const routineInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
  date: z
    .date('Date is required')
    .min(startOfToday(), 'Date must be today or later')
    .transform((d) => format(d, 'yyyy-MM-dd')),
});

export const routineSchema = routineInputSchema.extend({
  id: z.string(),
  date: z.iso.date(),
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable().optional().default(null),
});
