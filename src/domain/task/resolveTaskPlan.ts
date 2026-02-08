import { calculateNextOccurrence } from '@/domain/calendar/calculateNextOccurrence';
import type { CalendarIntervalUnit } from '@/domain/calendar/calendarInterval';
import { getRescheduleRule } from '@/domain/calendar/rescheduleRule';
import type { RescheduleAnchor } from '@/domain/task/rescheduleAnchors';
import type { TaskResolutionType } from '@/domain/task/taskResolutionTypes';

type TaskRescheduleFields = {
  rescheduleEvery: number | null;
  rescheduleUnit: CalendarIntervalUnit | null;
  rescheduleFrom: RescheduleAnchor | null;
};

export type TaskForResolution = TaskRescheduleFields & {
  id: string;
  userId: string;
  name: string;
  note: string | null;
  scheduledDate: string;
  previewLeadTime: number | null;
  previewUnit: CalendarIntervalUnit | null;
};

export type ResolveTaskPlanInput = {
  task: TaskForResolution;
  resolutionType: TaskResolutionType;
  resolvedDate: string;
  now: Date;
};

export type ResolveTaskPlan = {
  resolutionRecord: {
    taskId: string;
    resolutionType: TaskResolutionType;
    resolvedAt: Date;
    resolvedDate: string;
    scheduledDate: string;
  };
  taskUpdate: {
    resolvedAt: Date;
    updatedAt: Date;
  };
  nextTask: {
    userId: string;
    name: string;
    note: string | null;
    scheduledDate: string;
    previewLeadTime: number | null;
    previewUnit: CalendarIntervalUnit | null;
    rescheduleEvery: number;
    rescheduleUnit: CalendarIntervalUnit;
    rescheduleFrom: RescheduleAnchor;
    resolvedAt: null;
  } | null;
};

export function buildResolveTaskPlan(
  input: ResolveTaskPlanInput,
): ResolveTaskPlan {
  const { task, resolutionType, resolvedDate, now } = input;

  const resolutionRecord = {
    taskId: task.id,
    resolutionType,
    resolvedAt: now,
    resolvedDate,
    scheduledDate: task.scheduledDate,
  };

  const taskUpdate = {
    resolvedAt: now,
    updatedAt: now,
  };

  const rescheduleRule = getRescheduleRule(task);

  if (!rescheduleRule) {
    return { resolutionRecord, taskUpdate, nextTask: null };
  }

  const nextScheduledDate = calculateNextOccurrence({
    scheduledDate: task.scheduledDate,
    completionDate: resolvedDate,
    reschedule: rescheduleRule,
  });

  return {
    resolutionRecord,
    taskUpdate,
    nextTask: {
      userId: task.userId,
      name: task.name,
      note: task.note,
      scheduledDate: nextScheduledDate,
      previewLeadTime: task.previewLeadTime,
      previewUnit: task.previewUnit,
      rescheduleEvery: rescheduleRule.every,
      rescheduleUnit: rescheduleRule.unit,
      rescheduleFrom: rescheduleRule.from,
      resolvedAt: null,
    },
  };
}
