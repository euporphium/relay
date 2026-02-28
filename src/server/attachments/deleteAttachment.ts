import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { assertAttachmentOwnerAccess } from '@/server/attachments/attachmentOwners';
import { authMiddleware } from '@/server/middleware/auth';

const deleteAttachmentSchema = z.uuid();
const utApi = new UTApi();

export const deleteAttachment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteAttachmentSchema)
  .handler(async ({ data: attachmentId, context }) => {
    const { userId } = context;

    const attachment = await db.query.attachments.findFirst({
      where: and(
        eq(attachments.id, attachmentId),
        isNull(attachments.deletedAt),
      ),
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    await assertAttachmentOwnerAccess({
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
      userId,
      requiredAccess: 'edit',
    });

    await db
      .update(attachments)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(attachments.id, attachmentId));

    if (
      (attachment.type === 'image' || attachment.type === 'file') &&
      attachment.storageKey
    ) {
      await utApi.deleteFiles(attachment.storageKey);
    }
  });
