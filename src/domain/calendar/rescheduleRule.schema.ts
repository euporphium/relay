import { z } from 'zod';
import { calendarIntervalSchema } from './calendarInterval.schema';

export const rescheduleRuleSchema = calendarIntervalSchema.extend({
  from: z.enum(['scheduled', 'completion']),
});

export type RescheduleRuleInput = z.input<typeof rescheduleRuleSchema>;
