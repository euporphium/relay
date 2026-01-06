import { z } from 'zod';
import { calendarIntervalSchema } from '@/components/form/calendarInterval.schema';

export const taskFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  note: z.string().trim().optional(),
  scheduledDate: z.date('Date is required'),
  preview: calendarIntervalSchema.optional(),
});

export type TaskFormValues = z.input<typeof taskFormSchema>;

// export const taskSchema = taskInputSchema.extend({
//   id: z.string(),
//   scheduledDate: z.iso.date(),
//   createdAt: z.iso.datetime(),
//   completedAt: z.iso.datetime().nullable().optional().default(null),
// });

// /**
//  * Determines which date is used as the anchor when computing
//  * the next scheduled date.
//  *
//  * - scheduled: previous scheduled date
//  * - completion: actual completion date
//  */
// type RescheduleAnchor = 'scheduled' | 'completion';
//
// interface RescheduleRule {
//   /**
//    * Frequency value (e.g., every 2 weeks)
//    */
//   every: number;
//
//   unit: CalendarIntervalUnit;
//   from: RescheduleAnchor;
// }
//
// interface PreviewRule {
//   /**
//    * How far in advance a task should surface before its due date
//    */
//   leadTime: number;
//
//   /**
//    * Calendar unit for the preview window
//    */
//   unit: CalendarIntervalUnit;
// }
//
// export interface Task {
//   id: string;
//   name: string;
//   note?: string;
//   scheduledDate: Date;
//
//   preview?: PreviewRule;
//   reschedule?: RescheduleRule;
//
//   archivedAt?: Date;
//
//   createdAt: Date;
//   updatedAt: Date;
// }
//
// export interface TaskCompletion {
//   id: string;
//   taskId: string;
//
//   /**
//    * Absolute moment (UTC)
//    */
//   completedAt: Date;
//
//   /**
//    * Local calendar date at time of completion
//    * This is the authoritative value for analytics.
//    */
//   completedDate: Date;
//
//   /**
//    * Snapshot of what was due
//    */
//   dueDate: Date;
// }
