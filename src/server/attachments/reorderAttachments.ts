import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { attachmentOwnerTypes } from '@/domain/attachment/attachmentOwnerTypes';
import { validateAttachmentReorder } from '@/domain/attachment/validateAttachmentReorder';
import { assertAttachmentOwnerBelongsToUser } from '@/server/attachments/attachmentOwners';
import { authMiddleware } from '@/server/middleware/auth';

const reorderAttachmentsSchema = z.object({
  ownerType: z.enum(attachmentOwnerTypes),
  ownerId: z.uuid(),
  orderedIds: z.array(z.uuid()).min(1),
});

export const reorderAttachments = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(reorderAttachmentsSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await assertAttachmentOwnerBelongsToUser({
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      userId,
    });

    const rows = await db.query.attachments.findMany({
      where: and(
        eq(attachments.userId, userId),
        eq(attachments.ownerType, data.ownerType),
        eq(attachments.ownerId, data.ownerId),
        isNull(attachments.deletedAt),
      ),
      columns: {
        id: true,
      },
    });

    validateAttachmentReorder({
      orderedIds: data.orderedIds,
      activeIds: rows.map((row) => row.id),
    });

    const now = new Date();

    await db.transaction(async (tx) => {
      for (const [index, id] of data.orderedIds.entries()) {
        await tx
          .update(attachments)
          .set({
            position: index,
            updatedAt: now,
          })
          .where(
            and(
              eq(attachments.id, id),
              eq(attachments.userId, userId),
              eq(attachments.ownerType, data.ownerType),
              eq(attachments.ownerId, data.ownerId),
              isNull(attachments.deletedAt),
              inArray(attachments.id, data.orderedIds),
            ),
          );
      }
    });
  });
