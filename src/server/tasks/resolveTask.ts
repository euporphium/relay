import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskResolutions, tasks } from '@/db/schema';
import { calculateNextOccurrence } from '@/domain/calendar/calculateNextOccurrence';
import { getRescheduleRule } from '@/domain/calendar/rescheduleRule';
import { taskResolutionTypes } from '@/domain/task/taskResolutionTypes';
import { authMiddleware } from '@/server/middleware/auth';

export type ResolveTaskResult = {
  resolutionId: string;
  nextTask?: { id: string; scheduledDate: string };
};

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

      // 2. Create the resolution record
      const [resolution] = await tx
        .insert(taskResolutions)
        .values({
          taskId: task.id,
          resolutionType,
          resolvedAt: now,
          resolvedDate,
          scheduledDate: task.scheduledDate,
        })
        .returning({ id: taskResolutions.id });

      // 3. Resolve the task
      await tx
        .update(tasks)
        .set({
          resolvedAt: now,
          updatedAt: now,
        })
        .where(eq(tasks.id, id));

      const rescheduleRule = getRescheduleRule(task);

      if (!rescheduleRule) {
        return { resolutionId: resolution.id };
      }

      const nextScheduledDate = calculateNextOccurrence({
        scheduledDate: task.scheduledDate,
        completionDate: resolvedDate,
        reschedule: rescheduleRule,
      });

      const [nextTask] = await tx
        .insert(tasks)
        .values({
          userId,
          name: task.name,
          note: task.note,
          scheduledDate: nextScheduledDate,
          previewLeadTime: task.previewLeadTime,
          previewUnit: task.previewUnit,
          rescheduleEvery: rescheduleRule.every,
          rescheduleUnit: rescheduleRule.unit,
          rescheduleFrom: rescheduleRule.from,
          resolvedAt: null,
        })
        .returning({ id: tasks.id, scheduledDate: tasks.scheduledDate });

      return { resolutionId: resolution.id, nextTask };
    });
  });
