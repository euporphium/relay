import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskResolutions, tasks } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';
import type { ResolvedTask } from '@/shared/types/task';

export const getResolvedTasksForDate = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.iso.date())
  .handler(async ({ data: targetDate, context }): Promise<ResolvedTask[]> => {
    const { userId } = context;

    const rows = await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        name: tasks.name,
        note: tasks.note,
        scheduledDate: tasks.scheduledDate,
        previewLeadTime: tasks.previewLeadTime,
        previewUnit: tasks.previewUnit,
        rescheduleEvery: tasks.rescheduleEvery,
        rescheduleUnit: tasks.rescheduleUnit,
        rescheduleFrom: tasks.rescheduleFrom,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        resolvedAt: tasks.resolvedAt,
        resolutionId: taskResolutions.id,
        resolutionType: taskResolutions.resolutionType,
      })
      .from(taskResolutions)
      .innerJoin(tasks, eq(taskResolutions.taskId, tasks.id))
      .where(
        and(
          eq(tasks.userId, userId),
          eq(taskResolutions.resolvedDate, targetDate),
        ),
      )
      .orderBy(desc(taskResolutions.resolvedAt));

    return rows as ResolvedTask[];
  });
