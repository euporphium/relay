import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { attachmentOwnerTypes } from '@/domain/attachment/attachmentOwnerTypes';
import { assertAttachmentOwnerAccess } from '@/server/attachments/attachmentOwners';
import {
  buildMigratedStorageKey,
  isStorageKeyForAttachment,
} from '@/server/attachments/storageKeyPaths';
import { utApi } from '@/server/attachments/utApi';
import { authMiddleware } from '@/server/middleware/auth';

const getAttachmentsByOwnerSchema = z.object({
  ownerType: z.enum(attachmentOwnerTypes),
  ownerId: z.uuid(),
});

type AttachmentRow = typeof attachments.$inferSelect;

type MigratableUploadedAttachment = AttachmentRow & {
  type: 'image' | 'file';
  storageKey: string;
};

function isMigratableUploadedAttachment(
  attachment: AttachmentRow,
): attachment is MigratableUploadedAttachment {
  if (attachment.type !== 'image' && attachment.type !== 'file') return false;
  if (!attachment.storageKey) return false;
  return !isStorageKeyForAttachment(attachment.storageKey, attachment.id);
}

function replaceStorageKeyInUrl(
  url: string | null,
  oldKey: string,
  newKey: string,
) {
  if (!url) return null;
  if (!url.includes(oldKey)) return url;
  return url.replace(oldKey, newKey);
}

async function migrateLegacyAttachmentStorageKeys(
  rows: (typeof attachments.$inferSelect)[],
) {
  const now = new Date();
  const nextRows = [...rows];

  for (const [index, row] of rows.entries()) {
    if (!isMigratableUploadedAttachment(row)) {
      continue;
    }

    const previousStorageKey = row.storageKey;
    const nextStorageKey = buildMigratedStorageKey(row.id, previousStorageKey);

    try {
      // Lazy migration: normalize legacy keys to attachment-id-based names.
      await utApi.renameFiles({
        fileKey: previousStorageKey,
        newName: nextStorageKey,
      });

      const nextUrl = replaceStorageKeyInUrl(
        row.url,
        previousStorageKey,
        nextStorageKey,
      );

      await db
        .update(attachments)
        .set({
          storageKey: nextStorageKey,
          url: nextUrl,
          updatedAt: now,
        })
        .where(eq(attachments.id, row.id));

      nextRows[index] = {
        ...row,
        storageKey: nextStorageKey,
        url: nextUrl,
        updatedAt: now,
      };
    } catch (error) {
      console.error('attachment_storage_key_migration_failed', {
        attachmentId: row.id,
        previousStorageKey,
        nextStorageKey,
        error,
      });
    }
  }

  return nextRows;
}

export const getAttachmentsByOwner = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(getAttachmentsByOwnerSchema)
  .handler(async ({ data, context }) => {
    await assertAttachmentOwnerAccess({
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      userId: context.userId,
      requiredAccess: 'view',
    });

    const rows = await db.query.attachments.findMany({
      where: and(
        eq(attachments.ownerType, data.ownerType),
        eq(attachments.ownerId, data.ownerId),
        isNull(attachments.deletedAt),
      ),
      orderBy: [asc(attachments.position), asc(attachments.createdAt)],
    });

    return migrateLegacyAttachmentStorageKeys(rows);
  });
