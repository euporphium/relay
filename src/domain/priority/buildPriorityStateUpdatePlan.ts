import type { PriorityState } from './priorityStates';

export type PriorityStateUpdatePlanInput = {
  currentState: PriorityState;
  nextState: PriorityState;
  now: Date;
  nextPosition?: number;
};

export type PriorityStateUpdatePlan = {
  shouldUpdate: boolean;
  needsPosition: boolean;
  update?: {
    state: PriorityState;
    updatedAt: Date;
    position?: number;
  };
};

export function buildPriorityStateUpdatePlan(
  input: PriorityStateUpdatePlanInput,
): PriorityStateUpdatePlan {
  const { currentState, nextState, now, nextPosition } = input;

  if (currentState === nextState) {
    return { shouldUpdate: false, needsPosition: false };
  }

  const needsPosition = nextState === 'active' && currentState !== 'active';
  const update = {
    state: nextState,
    updatedAt: now,
    ...(typeof nextPosition === 'number' ? { position: nextPosition } : {}),
  };

  return { shouldUpdate: true, needsPosition, update };
}
