import {
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  differenceInDays,
  parseISO,
} from 'date-fns';
import { addInterval } from './addInterval';
import type { CalendarIntervalUnit } from './calendarInterval';

type CalculateNextOccurrenceInput = {
  scheduledDate: string;
  completionDate: string;
  reschedule: {
    every: number;
    unit: CalendarIntervalUnit;
    from: 'scheduled' | 'completion';
  };
};

const diffFunctions: Record<
  CalendarIntervalUnit,
  (left: Date, right: Date) => number
> = {
  day: differenceInDays,
  week: differenceInCalendarWeeks,
  month: differenceInCalendarMonths,
  year: differenceInCalendarYears,
};

export function calculateNextOccurrence(
  input: CalculateNextOccurrenceInput,
): string {
  const { every, unit, from } = input.reschedule;

  if (every <= 0) {
    throw new Error('Recurrence interval must be greater than 0');
  }

  const startDate =
    from === 'scheduled' ? input.scheduledDate : input.completionDate;

  const start = parseISO(startDate);
  const completion = parseISO(input.completionDate);

  const diff = diffFunctions[unit](completion, start);
  const intervalsToSkip = Math.max(1, Math.ceil(diff / every));

  let next = addInterval(startDate, unit, every, intervalsToSkip);

  // Fine-tune if needed
  while (next <= input.completionDate) {
    next = addInterval(next, unit, every);
  }

  return next;
}
