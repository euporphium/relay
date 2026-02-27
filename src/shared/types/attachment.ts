import type { AttachmentOwnerType } from '@/domain/attachment/attachmentOwnerTypes';
import type { AttachmentType } from '@/domain/attachment/attachmentTypes';

export type Attachment = {
  id: string;
  userId: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  type: AttachmentType;
  title: string | null;
  note: string | null;
  position: number;
  url: string | null;
  domain: string | null;
  description: string | null;
  previewImageUrl: string | null;
  fetchedAt: Date | null;
  storageKey: string | null;
  mimeType: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AttachmentSummary = {
  links: Attachment[];
  images: Attachment[];
  files: Attachment[];
  total: number;
};
