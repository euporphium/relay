import { describe, expect, test } from 'vitest';
import { buildPriorityStateUpdatePlan } from './buildPriorityStateUpdatePlan';

describe('buildPriorityStateUpdatePlan', () => {
  test('skips when state is unchanged', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityStateUpdatePlan({
      currentState: 'active',
      nextState: 'active',
      now,
    });

    expect(plan).toEqual({ shouldUpdate: false, needsPosition: false });
  });

  test('requires position when reactivating', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityStateUpdatePlan({
      currentState: 'completed',
      nextState: 'active',
      now,
    });

    expect(plan.shouldUpdate).toBe(true);
    expect(plan.needsPosition).toBe(true);
  });

  test('includes update payload without position when not needed', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityStateUpdatePlan({
      currentState: 'active',
      nextState: 'released',
      now,
    });

    expect(plan.update).toEqual({ state: 'released', updatedAt: now });
  });

  test('includes position when provided', () => {
    const now = new Date('2024-01-01T10:00:00Z');

    const plan = buildPriorityStateUpdatePlan({
      currentState: 'completed',
      nextState: 'active',
      now,
      nextPosition: 3,
    });

    expect(plan.update).toEqual({
      state: 'active',
      updatedAt: now,
      position: 3,
    });
  });
});
