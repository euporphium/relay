import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskCompletions, tasks } from '@/db/schema';

export const undoTaskCompletion = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      taskId: z.uuid(),
      completionId: z.uuid(),
      nextTaskId: z.uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      await tx
        .delete(taskCompletions)
        .where(eq(taskCompletions.id, data.completionId));

      await tx
        .update(tasks)
        .set({ archivedAt: null, updatedAt: new Date() })
        .where(eq(tasks.id, data.taskId));

      if (data.nextTaskId) {
        await tx.delete(tasks).where(eq(tasks.id, data.nextTaskId));
      }
    });
  });
