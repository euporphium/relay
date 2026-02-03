import { z } from 'zod';
import { calendarIntervalSchema } from '@/domain/calendar/calendarInterval.schema';
import { rescheduleRuleSchema } from '@/domain/calendar/rescheduleRule.schema';

export const taskInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  note: z.string().trim().optional(),
  scheduledDate: z.date('Date is required'),
  preview: calendarIntervalSchema.optional(),
  reschedule: rescheduleRuleSchema.optional(),
});

export type TaskInput = z.input<typeof taskInputSchema>;
