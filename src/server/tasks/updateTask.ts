import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { taskServerInputSchema } from '@/schemas/task';

export const updateTask = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.uuid(),
      updates: taskServerInputSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { id, updates: task } = data;

    const result = await db
      .update(tasks)
      .set({
        name: task.name,
        note: task.note,
        scheduledDate: task.scheduledDate,

        previewLeadTime: task.preview?.value ?? null,
        previewUnit: task.preview?.unit ?? null,

        // hardcoded for now
        rescheduleEvery: null,
        rescheduleUnit: null,
        rescheduleFrom: null,

        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });

    if (result.length === 0) {
      throw new Error('Task not found');
    }
  });
