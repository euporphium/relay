export const attachmentTypes = ['link', 'image', 'file'] as const;

export type AttachmentType = (typeof attachmentTypes)[number];
