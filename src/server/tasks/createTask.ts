import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { taskServerInputSchema } from '@/schemas/task';

export const createTask = createServerFn({ method: 'POST' })
  .inputValidator(taskServerInputSchema)
  .handler(async ({ data }) => {
    await db.insert(tasks).values({
      name: data.name,
      note: data.note,
      scheduledDate: data.scheduledDate,
      previewLeadTime: data.preview?.value,
      previewUnit: data.preview?.unit,

      // hardcoded for now
      rescheduleEvery: null,
      rescheduleUnit: null,
      rescheduleFrom: null,
      archivedAt: null,
    });
  });
