import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { priorities } from '@/db/schema';
import { hardDeleteOwnerAttachmentsAndRunInTransaction } from '@/server/attachments/hardDeleteOwnerAttachments';
import { authMiddleware } from '@/server/middleware/auth';
import { getEditablePriorityOrThrow } from '@/server/priorities/getEditablePriorityOrThrow';

export const deletePriority = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.uuid())
  .handler(async ({ data: id, context }) => {
    const { userId } = context;

    const existing = await getEditablePriorityOrThrow({
      priorityId: id,
      userId,
    });

    await hardDeleteOwnerAttachmentsAndRunInTransaction({
      ownerType: 'priority',
      ownerId: existing.id,
      runInTransaction: async (tx) => {
        const result = await tx
          .delete(priorities)
          .where(eq(priorities.id, existing.id))
          .returning({ id: priorities.id });

        if (result.length === 0) {
          throw new Error('Priority not found');
        }
      },
    });
  });
