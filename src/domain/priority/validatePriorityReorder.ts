const REORDER_MISMATCH_ERROR = 'Priority mismatch while reordering';

export type PriorityReorderInput = {
  orderedIds: string[];
  activeIds: string[];
};

export function validatePriorityReorder(input: PriorityReorderInput): void {
  const { orderedIds, activeIds } = input;

  if (orderedIds.length !== activeIds.length) {
    throw new Error(REORDER_MISMATCH_ERROR);
  }

  const uniqueOrdered = new Set(orderedIds);

  if (uniqueOrdered.size !== orderedIds.length) {
    throw new Error(REORDER_MISMATCH_ERROR);
  }

  const activeSet = new Set(activeIds);

  if (orderedIds.some((id) => !activeSet.has(id))) {
    throw new Error(REORDER_MISMATCH_ERROR);
  }
}
