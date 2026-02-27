import type { Attachment, AttachmentSummary } from '@/shared/types/attachment';

export function buildAttachmentSummary(
  attachments: Attachment[] | undefined,
): AttachmentSummary {
  const source = attachments ?? [];

  return {
    links: source.filter((attachment) => attachment.type === 'link'),
    images: source.filter((attachment) => attachment.type === 'image'),
    files: source.filter((attachment) => attachment.type === 'file'),
    total: source.length,
  };
}
