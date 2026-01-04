import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { taskSchema } from '@/schemas/task';

export const createTask = createServerFn({ method: 'POST' })
  .inputValidator(taskSchema)
  .handler(async ({ data }) => {
    await db.insert(tasks).values({
      id: data.id,
      name: data.name,
      note: data.note,
      scheduledDate: new Date(data.scheduledDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.createdAt),

      // hardcoded for now
      previewLeadTime: null,
      previewUnit: null,
      rescheduleEvery: null,
      rescheduleUnit: null,
      rescheduleFrom: null,
      archivedAt: null,
    });
  });
