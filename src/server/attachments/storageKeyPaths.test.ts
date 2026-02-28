import { describe, expect, test } from 'vitest';
import {
  buildAttachmentUploadName,
  buildMigratedStorageKey,
  isStorageKeyForAttachment,
} from './storageKeyPaths';

describe('storageKeyPaths', () => {
  const attachmentId = '5b62003c-3e80-45e1-bb0f-9df53f2b787f';

  describe('buildAttachmentUploadName', () => {
    test('uses attachment id with file extension', () => {
      expect(buildAttachmentUploadName(attachmentId, 'invoice.pdf')).toBe(
        `${attachmentId}.pdf`,
      );
    });

    test('uses attachment id without extension when file has none', () => {
      expect(buildAttachmentUploadName(attachmentId, 'README')).toBe(
        attachmentId,
      );
    });

    test('ignores leading-dot filenames as extensionless', () => {
      expect(buildAttachmentUploadName(attachmentId, '.env')).toBe(
        attachmentId,
      );
    });
  });

  describe('buildMigratedStorageKey', () => {
    test('reuses extension from existing key', () => {
      expect(
        buildMigratedStorageKey(attachmentId, 'legacy/random-key/image.png'),
      ).toBe(`${attachmentId}.png`);
    });

    test('returns bare attachment id for extensionless keys', () => {
      expect(buildMigratedStorageKey(attachmentId, 'legacy-key')).toBe(
        attachmentId,
      );
    });
  });

  describe('isStorageKeyForAttachment', () => {
    test('matches exact attachment id key', () => {
      expect(isStorageKeyForAttachment(attachmentId, attachmentId)).toBe(true);
    });

    test('matches attachment id with extension', () => {
      expect(
        isStorageKeyForAttachment(`${attachmentId}.jpg`, attachmentId),
      ).toBe(true);
    });

    test('rejects keys for other attachments', () => {
      expect(
        isStorageKeyForAttachment(
          'f955f8ce-3d92-4bd8-886c-147f3f66f59a.jpg',
          attachmentId,
        ),
      ).toBe(false);
    });

    test('rejects partial id prefix matches', () => {
      expect(
        isStorageKeyForAttachment(`${attachmentId}-alt.jpg`, attachmentId),
      ).toBe(false);
    });
  });
});
