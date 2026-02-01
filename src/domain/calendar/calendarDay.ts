import { format, parseISO } from 'date-fns';

export type CalendarDay = {
  iso: string;
  date: Date;
  display: string;
};

export function createCalendarDay(iso: string): CalendarDay {
  const date = parseISO(iso);

  return {
    iso,
    date,
    display: format(date, 'EEE, MMM d'),
  };
}
