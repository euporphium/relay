import type { CalendarIntervalUnit } from './calendarInterval';

export type RescheduleFields = {
  rescheduleEvery: number | null;
  rescheduleUnit: CalendarIntervalUnit | null;
  rescheduleFrom: 'scheduled' | 'completion' | null;
};

export type RescheduleRule = {
  every: number;
  unit: CalendarIntervalUnit;
  from: 'scheduled' | 'completion';
};

export function getRescheduleRule(
  task: RescheduleFields,
): RescheduleRule | null {
  if (
    task.rescheduleEvery == null ||
    task.rescheduleUnit == null ||
    task.rescheduleFrom == null
  ) {
    return null;
  }

  return {
    every: task.rescheduleEvery,
    unit: task.rescheduleUnit as CalendarIntervalUnit,
    from: task.rescheduleFrom,
  };
}
