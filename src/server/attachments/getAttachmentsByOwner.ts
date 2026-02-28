import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { attachmentOwnerTypes } from '@/domain/attachment/attachmentOwnerTypes';
import { assertAttachmentOwnerAccess } from '@/server/attachments/attachmentOwners';
import { authMiddleware } from '@/server/middleware/auth';

const getAttachmentsByOwnerSchema = z.object({
  ownerType: z.enum(attachmentOwnerTypes),
  ownerId: z.uuid(),
});

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

    return db.query.attachments.findMany({
      where: and(
        eq(attachments.ownerType, data.ownerType),
        eq(attachments.ownerId, data.ownerId),
        isNull(attachments.deletedAt),
      ),
      orderBy: [asc(attachments.position), asc(attachments.createdAt)],
    });
  });
