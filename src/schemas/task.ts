import { format } from 'date-fns';
import { z } from 'zod';
import { calendarIntervalSchema } from '@/schemas/calendarInterval';
import type { getTask } from '@/server/tasks/getTask';
import type { getTasksForDate } from '@/server/tasks/getTasksForDate';

export const taskFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  note: z.string().trim().optional(),
  scheduledDate: z.date('Date is required'),
  preview: calendarIntervalSchema.optional(),
});

export type TaskFormValues = z.input<typeof taskFormSchema>;

// TODO move to /server?
export const taskServerInputSchema = taskFormSchema.transform((v) => ({
  ...v,
  note: v.note?.trim() ?? undefined,
  scheduledDate: format(v.scheduledDate, 'yyyy-MM-dd'),
}));

export type Task = Awaited<ReturnType<typeof getTask>>;

type GetTasksForDateResult = Awaited<ReturnType<typeof getTasksForDate>>;
export type TaskForDate = GetTasksForDateResult[number];
