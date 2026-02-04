import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskResolutions, tasks } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const undoTaskResolution = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      taskId: z.uuid(),
      resolutionId: z.uuid(),
      nextTaskId: z.uuid().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await db.transaction(async (tx) => {
      // Verify the task belongs to the user before proceeding
      const [task] = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.id, data.taskId), eq(tasks.userId, userId)))
        .limit(1);

      if (!task) {
        throw new Error('Task not found');
      }

      await tx
        .delete(taskResolutions)
        .where(eq(taskResolutions.id, data.resolutionId));

      await tx
        .update(tasks)
        .set({ resolvedAt: null, updatedAt: new Date() })
        .where(and(eq(tasks.id, data.taskId), eq(tasks.userId, userId)));

      if (data.nextTaskId) {
        await tx
          .delete(tasks)
          .where(and(eq(tasks.id, data.nextTaskId), eq(tasks.userId, userId)));
      }
    });
  });
