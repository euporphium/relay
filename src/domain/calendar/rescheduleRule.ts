import type { CalendarIntervalUnit } from './calendarInterval';
import type { RescheduleAnchor } from '@/domain/task/rescheduleAnchors';

export type RescheduleFields = {
  rescheduleEvery: number | null;
  rescheduleUnit: CalendarIntervalUnit | null;
  rescheduleFrom: RescheduleAnchor | null;
};

export type RescheduleRule = {
  every: number;
  unit: CalendarIntervalUnit;
  from: RescheduleAnchor;
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
