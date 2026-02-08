import { describe, expect, test } from 'vitest';
import { buildResolveTaskPlan } from './resolveTaskPlan';

const baseTask = {
  id: 'task-1',
  userId: 'user-1',
  name: 'Task Name',
  note: 'Note',
  scheduledDate: '2024-01-01',
  previewLeadTime: 2,
  previewUnit: 'day' as const,
  rescheduleEvery: null,
  rescheduleUnit: null,
  rescheduleFrom: null,
};

describe('buildResolveTaskPlan', () => {
  test('returns a plan without a next task when no reschedule rule exists', () => {
    const now = new Date('2024-01-05T10:00:00Z');

    const plan = buildResolveTaskPlan({
      task: baseTask,
      resolutionType: 'completed',
      resolvedDate: '2024-01-05',
      now,
    });

    expect(plan.nextTask).toBeNull();
    expect(plan.resolutionRecord).toEqual({
      taskId: 'task-1',
      resolutionType: 'completed',
      resolvedAt: now,
      resolvedDate: '2024-01-05',
      scheduledDate: '2024-01-01',
    });
    expect(plan.taskUpdate).toEqual({ resolvedAt: now, updatedAt: now });
  });

  test('builds the next task using the reschedule rule', () => {
    const now = new Date('2024-01-10T10:00:00Z');

    const plan = buildResolveTaskPlan({
      task: {
        ...baseTask,
        rescheduleEvery: 1,
        rescheduleUnit: 'day',
        rescheduleFrom: 'completion',
      },
      resolutionType: 'completed',
      resolvedDate: '2024-01-10',
      now,
    });

    expect(plan.nextTask).toEqual({
      userId: 'user-1',
      name: 'Task Name',
      note: 'Note',
      scheduledDate: '2024-01-11',
      previewLeadTime: 2,
      previewUnit: 'day',
      rescheduleEvery: 1,
      rescheduleUnit: 'day',
      rescheduleFrom: 'completion',
      resolvedAt: null,
    });
  });

  test('uses the scheduled anchor when rescheduling from scheduled date', () => {
    const now = new Date('2024-01-10T10:00:00Z');

    const plan = buildResolveTaskPlan({
      task: {
        ...baseTask,
        rescheduleEvery: 2,
        rescheduleUnit: 'day',
        rescheduleFrom: 'scheduled',
      },
      resolutionType: 'completed',
      resolvedDate: '2024-01-10',
      now,
    });

    expect(plan.nextTask?.scheduledDate).toBe('2024-01-11');
  });

  test('returns no next task when reschedule fields are incomplete', () => {
    const now = new Date('2024-01-05T10:00:00Z');

    const plan = buildResolveTaskPlan({
      task: {
        ...baseTask,
        rescheduleEvery: 1,
        rescheduleUnit: null,
        rescheduleFrom: 'completion',
      },
      resolutionType: 'completed',
      resolvedDate: '2024-01-05',
      now,
    });

    expect(plan.nextTask).toBeNull();
  });

  test('creates a rescheduled task when skipped', () => {
    const now = new Date('2024-01-10T10:00:00Z');

    const plan = buildResolveTaskPlan({
      task: {
        ...baseTask,
        rescheduleEvery: 1,
        rescheduleUnit: 'day',
        rescheduleFrom: 'completion',
      },
      resolutionType: 'skipped',
      resolvedDate: '2024-01-10',
      now,
    });

    expect(plan.resolutionRecord.resolutionType).toBe('skipped');
    expect(plan.nextTask?.scheduledDate).toBe('2024-01-11');
  });
});
