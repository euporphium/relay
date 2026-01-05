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
      scheduledDate: data.scheduledDate,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.createdAt),
      previewLeadTime: data.preview?.value,
      previewUnit: data.preview?.unit,

      // hardcoded for now
      rescheduleEvery: null,
      rescheduleUnit: null,
      rescheduleFrom: null,
      archivedAt: null,
    });
  });
