import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { attachmentOwnerTypes } from '@/domain/attachment/attachmentOwnerTypes';
import { assertAttachmentOwnerAccess } from '@/server/attachments/attachmentOwners';
import { utApi } from '@/server/attachments/utApi';
import { authMiddleware } from '@/server/middleware/auth';

const getAttachmentsByOwnerSchema = z.object({
  ownerType: z.enum(attachmentOwnerTypes),
  ownerId: z.uuid(),
});

function isMigratableUploadedAttachment(
  attachment: Pick<typeof attachments.$inferSelect, 'type' | 'storageKey'>,
  userId: string,
) {
  if (attachment.type !== 'image' && attachment.type !== 'file') return false;
  if (!attachment.storageKey) return false;
  return !attachment.storageKey.includes(`${userId}/`);
}

function buildUserScopedStorageKey(
  userId: string,
  attachmentId: string,
  key: string,
) {
  const fileName = key.split('/').filter(Boolean).pop() ?? 'file';
  return `${userId}/${attachmentId}-${fileName}`;
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
  userId: string,
) {
  const now = new Date();
  const nextRows = [...rows];

  for (const [index, row] of rows.entries()) {
    if (!isMigratableUploadedAttachment(row, userId)) {
      continue;
    }

    const previousStorageKey = row.storageKey;
    const nextStorageKey = buildUserScopedStorageKey(
      userId,
      row.id,
      previousStorageKey,
    );

    try {
      // Temporary lazy migration: move legacy file keys into per-user folders.
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
        userId,
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

    return migrateLegacyAttachmentStorageKeys(rows, context.userId);
  });
