import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';
import { taskServerInputSchema } from '@/server/tasks/createTask';

export const updateTask = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.uuid(),
      updates: taskServerInputSchema,
    }),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { id, updates: task } = data;

    const result = await db
      .update(tasks)
      .set({
        name: task.name,
        note: task.note,
        scheduledDate: task.scheduledDate,

        previewLeadTime: task.preview?.value ?? null,
        previewUnit: task.preview?.unit ?? null,

        rescheduleEvery: task.reschedule?.value ?? null,
        rescheduleUnit: task.reschedule?.unit ?? null,
        rescheduleFrom: task.reschedule?.from ?? null,

        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning({ id: tasks.id });

    if (result.length === 0) {
      throw new Error('Task not found');
    }
  });
