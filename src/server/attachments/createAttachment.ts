import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { attachmentOwnerTypes } from '@/domain/attachment/attachmentOwnerTypes';
import { assertAttachmentOwnerBelongsToUser } from '@/server/attachments/attachmentOwners';
import {
  fetchLinkMetadata,
  normalizeAttachmentLink,
} from '@/server/attachments/linkMetadata';
import { authMiddleware } from '@/server/middleware/auth';

const createAttachmentSchema = z.object({
  ownerType: z.enum(attachmentOwnerTypes),
  ownerId: z.uuid(),
  type: z.literal('link'),
  url: z.url().refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Only http and https links are allowed'),
  note: z.string().trim().max(2000).optional(),
  title: z.string().trim().max(500).optional(),
});

export const createAttachment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createAttachmentSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await assertAttachmentOwnerBelongsToUser({
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      userId,
    });

    const now = new Date();

    const [positionRow] = await db
      .select({ max: sql<number>`max(${attachments.position})` })
      .from(attachments)
      .where(
        and(
          eq(attachments.userId, userId),
          eq(attachments.ownerType, data.ownerType),
          eq(attachments.ownerId, data.ownerId),
          isNull(attachments.deletedAt),
        ),
      );

    const normalized = await normalizeAttachmentLink(data.url);

    const [inserted] = await db
      .insert(attachments)
      .values({
        userId,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        type: 'link',
        title: data.title || null,
        note: data.note || null,
        position: (positionRow?.max ?? -1) + 1,
        url: normalized.canonicalUrl,
        domain: normalized.domain,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create attachment');
    }

    try {
      const metadata = await fetchLinkMetadata(normalized.canonicalUrl);
      const [updated] = await db
        .update(attachments)
        .set({
          title: inserted.title || metadata.title,
          url: metadata.canonicalUrl,
          domain: metadata.domain,
          description: metadata.description,
          previewImageUrl: metadata.previewImageUrl,
          fetchedAt: metadata.fetchedAt,
          updatedAt: new Date(),
        })
        .where(eq(attachments.id, inserted.id))
        .returning();

      return updated ?? inserted;
    } catch {
      return inserted;
    }
  });
