import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskResolutions, tasks } from '@/db/schema';
import { taskResolutionTypes } from '@/domain/task/taskResolutionTypes';
import { authMiddleware } from '@/server/middleware/auth';

export const updateTaskResolutionType = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      taskId: z.uuid(),
      resolutionId: z.uuid(),
      resolutionType: z.enum(taskResolutionTypes),
    }),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [task] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, data.taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      throw new Error('Task not found');
    }

    await db
      .update(taskResolutions)
      .set({ resolutionType: data.resolutionType })
      .where(eq(taskResolutions.id, data.resolutionId));
  });
