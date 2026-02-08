import type { CommitmentState } from './commitmentStates';

export type CommitmentStateUpdatePlanInput = {
  currentState: CommitmentState;
  nextState: CommitmentState;
  now: Date;
  nextPosition?: number;
};

export type CommitmentStateUpdatePlan = {
  shouldUpdate: boolean;
  needsPosition: boolean;
  update?: {
    state: CommitmentState;
    updatedAt: Date;
    position?: number;
  };
};

export function buildCommitmentStateUpdatePlan(
  input: CommitmentStateUpdatePlanInput,
): CommitmentStateUpdatePlan {
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
