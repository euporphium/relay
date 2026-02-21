import type { PriorityState } from './priorityStates';

type PositionScope = 'active' | 'all';

export type PriorityUpdatePlanInput = {
  currentGroupId: string | null;
  currentState: PriorityState;
  nextGroupId: string | null;
  nextOwnerId: string;
  title: string;
  note?: string;
  now: Date;
  nextPosition?: number;
};

export type PriorityUpdatePlan = {
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

export function buildPriorityUpdatePlan(
  input: PriorityUpdatePlanInput,
): PriorityUpdatePlan {
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
