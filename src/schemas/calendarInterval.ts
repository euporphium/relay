import { z } from 'zod';
import { calendarIntervalUnits } from '@/domain/calendar/calendarInterval';

export const calendarIntervalUnitSchema = z.enum(calendarIntervalUnits);

export const calendarIntervalSchema = z.object({
  value: z.coerce
    .number({ error: 'Interval must be a number' })
    .int({ error: 'Interval must be a whole number' })
    .positive({ error: 'Interval must be greater than zero' }),
  unit: calendarIntervalUnitSchema,
});

export type CalendarIntervalInput = z.input<typeof calendarIntervalSchema>;
