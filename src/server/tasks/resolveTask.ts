import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskResolutions, tasks } from '@/db/schema';
import { buildResolveTaskPlan } from '@/domain/task/resolveTaskPlan';
import { taskResolutionTypes } from '@/domain/task/taskResolutionTypes';
import { authMiddleware } from '@/server/middleware/auth';
import type { ResolveTaskResult } from '@/shared/types/task';

export const resolveTask = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.uuid(),
      resolutionType: z.enum(taskResolutionTypes),
      resolvedDate: z.iso.date(),
    }),
  )
  .handler(async ({ data, context }): Promise<ResolveTaskResult> => {
    const { userId } = context;
    const { id, resolutionType, resolvedDate } = data;

    return db.transaction(async (tx) => {
      // 1. Get the current task details for the snapshot
      const [task] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .limit(1);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.resolvedAt) {
        throw new Error('Task is already resolved');
      }

      const now = new Date();
      const plan = buildResolveTaskPlan({
        task,
        resolutionType,
        resolvedDate,
        now,
      });

      // 2. Create the resolution record
      const [resolution] = await tx
        .insert(taskResolutions)
        .values(plan.resolutionRecord)
        .returning({ id: taskResolutions.id });

      // 3. Resolve the task
      await tx.update(tasks).set(plan.taskUpdate).where(eq(tasks.id, id));

      if (!plan.nextTask) {
        return { resolutionId: resolution.id };
      }

      const [nextTask] = await tx
        .insert(tasks)
        .values(plan.nextTask)
        .returning({ id: tasks.id, scheduledDate: tasks.scheduledDate });

      return { resolutionId: resolution.id, nextTask };
    });
  });
