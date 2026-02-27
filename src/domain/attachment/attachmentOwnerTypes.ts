export const attachmentOwnerTypes = ['task', 'priority'] as const;

export type AttachmentOwnerType = (typeof attachmentOwnerTypes)[number];
