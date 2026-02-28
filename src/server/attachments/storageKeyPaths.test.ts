import { describe, expect, test } from 'vitest';
import { buildAttachmentUploadName } from './storageKeyPaths';

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
});
