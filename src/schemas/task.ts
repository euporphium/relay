import { format } from 'date-fns';
import z from 'zod';
import { startOfToday } from '@/lib/utils';

export const taskInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  note: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
  scheduledDate: z
    .date('Date is required')
    .min(startOfToday(), 'Date must be today or later')
    .transform((d) => format(d, 'yyyy-MM-dd')),
});

export const taskSchema = taskInputSchema.extend({
  id: z.string(),
  scheduledDate: z.iso.date(),
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable().optional().default(null),
});
