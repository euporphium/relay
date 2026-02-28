import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { hardDeleteOwnerAttachmentsAndRunInTransaction } from '@/server/attachments/hardDeleteOwnerAttachments';
import { authMiddleware } from '@/server/middleware/auth';

export const deleteTask = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.uuid())
  .handler(async ({ data: id, context }) => {
    const { userId } = context;

    const [task] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    if (!task) {
      throw new Error('Task not found');
    }

    await hardDeleteOwnerAttachmentsAndRunInTransaction({
      ownerType: 'task',
      ownerId: task.id,
      runInTransaction: async (tx) => {
        const result = await tx
          .delete(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
          .returning({ id: tasks.id });

        if (result.length === 0) {
          throw new Error('Task not found');
        }
      },
    });
  });
