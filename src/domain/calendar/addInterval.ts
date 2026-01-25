import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  parseISO,
} from 'date-fns';
import type { CalendarIntervalUnit } from './calendarInterval';

const intervalAdders: Record<
  CalendarIntervalUnit,
  (date: Date, amount: number) => Date
> = {
  day: addDays,
  week: addWeeks,
  month: addMonths,
  year: addYears,
};

export function addInterval(
  dateStr: string,
  unit: CalendarIntervalUnit,
  every: number,
  multiplier: number = 1,
): string {
  const date = parseISO(dateStr);
  const amount = every * multiplier;

  return format(intervalAdders[unit](date, amount), 'yyyy-MM-dd');
}
