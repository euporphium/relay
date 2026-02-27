import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { fetchLinkMetadata } from '@/server/attachments/linkMetadata';
import { authMiddleware } from '@/server/middleware/auth';

const refreshAttachmentMetadataSchema = z.uuid();

export const refreshAttachmentMetadata = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(refreshAttachmentMetadataSchema)
  .handler(async ({ data: attachmentId, context }) => {
    const { userId } = context;

    const attachment = await db.query.attachments.findFirst({
      where: and(
        eq(attachments.id, attachmentId),
        eq(attachments.userId, userId),
        eq(attachments.type, 'link'),
        isNull(attachments.deletedAt),
      ),
    });

    if (!attachment?.url) {
      throw new Error('Attachment not found');
    }

    const metadata = await fetchLinkMetadata(attachment.url);

    const [updated] = await db
      .update(attachments)
      .set({
        title: metadata.title ?? attachment.title,
        url: metadata.canonicalUrl,
        domain: metadata.domain,
        description: metadata.description,
        previewImageUrl: metadata.previewImageUrl,
        fetchedAt: metadata.fetchedAt,
        updatedAt: new Date(),
      })
      .where(eq(attachments.id, attachment.id))
      .returning();

    return updated ?? attachment;
  });
