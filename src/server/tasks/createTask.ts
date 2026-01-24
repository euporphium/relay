import { createServerFn } from '@tanstack/react-start';
import { format } from 'date-fns';
import { taskFormSchema } from '@/components/task/taskForm.schema';
import { db } from '@/db';
import { tasks } from '@/db/schema';

export const taskServerInputSchema = taskFormSchema.transform((v) => ({
  ...v,
  note: v.note?.trim() ?? undefined,
  scheduledDate: format(v.scheduledDate, 'yyyy-MM-dd'),
}));

export const createTask = createServerFn({ method: 'POST' })
  .inputValidator(taskServerInputSchema)
  .handler(async ({ data }) => {
    await db.insert(tasks).values({
      name: data.name,
      note: data.note,
      scheduledDate: data.scheduledDate,
      previewLeadTime: data.preview?.value,
      previewUnit: data.preview?.unit,

      rescheduleEvery: data.reschedule?.value,
      rescheduleUnit: data.reschedule?.unit,
      rescheduleFrom: data.reschedule?.from,
      archivedAt: null,
    });
  });
