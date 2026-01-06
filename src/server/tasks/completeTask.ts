import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskCompletions, tasks } from '@/db/schema';

export const completeTask = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.uuid(),
      completedDate: z.iso.date(),
    }),
  )
  .handler(async ({ data }) => {
    const { id, completedDate } = data;

    await db.transaction(async (tx) => {
      // 1. Get the current task details for the snapshot
      const [task] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.archivedAt) {
        throw new Error('Task is already completed/archived');
      }

      const now = new Date();

      // 2. Create the completion record
      await tx.insert(taskCompletions).values({
        taskId: task.id,
        completedAt: now,
        completedDate,
        scheduledDate: task.scheduledDate,
      });

      // 3. Archive the task
      await tx
        .update(tasks)
        .set({
          archivedAt: now,
          updatedAt: now,
        })
        .where(eq(tasks.id, id));
    });

    return { success: true };
  });
