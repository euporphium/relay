export const ATTACHMENT_REORDER_ERROR = 'Invalid attachment order';

export function validateAttachmentReorder(input: {
  orderedIds: string[];
  activeIds: string[];
}) {
  const orderedIds = [...input.orderedIds].sort();
  const activeIds = [...input.activeIds].sort();

  if (
    orderedIds.length !== activeIds.length ||
    activeIds.some((id, index) => id !== orderedIds[index])
  ) {
    throw new Error(ATTACHMENT_REORDER_ERROR);
  }
}
