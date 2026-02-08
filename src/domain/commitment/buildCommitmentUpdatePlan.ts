import type { CommitmentState } from './commitmentStates';

type PositionScope = 'active' | 'all';

export type CommitmentUpdatePlanInput = {
  currentGroupId: string | null;
  currentState: CommitmentState;
  nextGroupId: string | null;
  nextOwnerId: string;
  title: string;
  note?: string;
  now: Date;
  nextPosition?: number;
};

export type CommitmentUpdatePlan = {
  needsPosition: boolean;
  positionScope: PositionScope | null;
  update: {
    userId: string;
    title: string;
    note?: string;
    groupId: string | null;
    updatedAt: Date;
    position?: number;
  };
};

export function buildCommitmentUpdatePlan(
  input: CommitmentUpdatePlanInput,
): CommitmentUpdatePlan {
  const {
    currentGroupId,
    currentState,
    nextGroupId,
    nextOwnerId,
    title,
    note,
    now,
    nextPosition,
  } = input;

  const needsPosition = currentGroupId !== nextGroupId;
  const positionScope = needsPosition
    ? currentState === 'active'
      ? 'active'
      : 'all'
    : null;

  return {
    needsPosition,
    positionScope,
    update: {
      userId: nextOwnerId,
      title,
      note,
      groupId: nextGroupId,
      updatedAt: now,
      ...(typeof nextPosition === 'number' ? { position: nextPosition } : {}),
    },
  };
}
