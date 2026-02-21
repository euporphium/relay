import { describe, expect, test } from 'vitest';
import { buildPriorityUpdatePlan } from './buildPriorityUpdatePlan';

describe('buildPriorityUpdatePlan', () => {
  test('does not request position when group is unchanged', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityUpdatePlan({
      currentGroupId: 'group-1',
      currentState: 'active',
      nextGroupId: 'group-1',
      nextOwnerId: 'owner-1',
      title: 'Read more',
      note: 'At least 10 pages',
      now,
    });

    expect(plan).toEqual({
      needsPosition: false,
      positionScope: null,
      update: {
        userId: 'owner-1',
        title: 'Read more',
        note: 'At least 10 pages',
        groupId: 'group-1',
        updatedAt: now,
      },
    });
  });

  test('requests active-position lookup when moving an active priority', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityUpdatePlan({
      currentGroupId: null,
      currentState: 'active',
      nextGroupId: 'group-2',
      nextOwnerId: 'owner-2',
      title: 'Train',
      now,
    });

    expect(plan.needsPosition).toBe(true);
    expect(plan.positionScope).toBe('active');
  });

  test('requests all-position lookup when moving an inactive priority', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityUpdatePlan({
      currentGroupId: 'group-1',
      currentState: 'released',
      nextGroupId: null,
      nextOwnerId: 'owner-1',
      title: 'Train',
      now,
    });

    expect(plan.needsPosition).toBe(true);
    expect(plan.positionScope).toBe('all');
  });

  test('includes position when provided', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityUpdatePlan({
      currentGroupId: 'group-1',
      currentState: 'active',
      nextGroupId: null,
      nextOwnerId: 'owner-1',
      title: 'Plan trip',
      now,
      nextPosition: 7,
    });

    expect(plan.update).toEqual({
      userId: 'owner-1',
      title: 'Plan trip',
      note: undefined,
      groupId: null,
      updatedAt: now,
      position: 7,
    });
  });
});
