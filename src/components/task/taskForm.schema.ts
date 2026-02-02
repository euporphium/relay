import { z } from 'zod';
import { calendarIntervalSchema } from '@/components/form/calendarInterval.schema';

export const taskFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  note: z.string().trim().optional(),
  scheduledDate: z.date('Date is required'),
  preview: calendarIntervalSchema.optional(),
  reschedule: calendarIntervalSchema
    .extend({
      from: z.enum(['scheduled', 'completion']),
    })
    .optional(),
});

export type TaskFormValues = z.input<typeof taskFormSchema>;
