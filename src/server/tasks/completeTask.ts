import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { taskCompletions, tasks } from '@/db/schema';
import { calculateNextOccurrence } from '@/domain/calendar/calculateNextOccurrence';
import { getRescheduleRule } from '@/domain/calendar/rescheduleRule';

export type CompleteTaskResult = {
  completionId: string;
  nextTask?: { id: string; scheduledDate: string };
};

export const completeTask = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.uuid(),
      completedDate: z.iso.date(),
    }),
  )
  .handler(async ({ data }): Promise<CompleteTaskResult> => {
    const { id, completedDate } = data;

    return db.transaction(async (tx) => {
      // 1. Get the current task details for the snapshot
      const [task] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.archivedAt) {
        throw new Error('Task is already completed/archived');
      }

      const now = new Date();

      // 2. Create the completion record
      const [completion] = await tx
        .insert(taskCompletions)
        .values({
          taskId: task.id,
          completedAt: now,
          completedDate,
          scheduledDate: task.scheduledDate,
        })
        .returning({ id: taskCompletions.id });

      // 3. Archive the task
      await tx
        .update(tasks)
        .set({
          archivedAt: now,
          updatedAt: now,
        })
        .where(eq(tasks.id, id));

      const rescheduleRule = getRescheduleRule(task);

      if (!rescheduleRule) {
        return { completionId: completion.id };
      }

      const nextScheduledDate = calculateNextOccurrence({
        scheduledDate: task.scheduledDate,
        completionDate: completedDate,
        reschedule: rescheduleRule,
      });

      const [nextTask] = await tx
        .insert(tasks)
        .values({
          name: task.name,
          note: task.note,
          scheduledDate: nextScheduledDate,
          previewLeadTime: task.previewLeadTime,
          previewUnit: task.previewUnit,
          rescheduleEvery: rescheduleRule.every,
          rescheduleUnit: rescheduleRule.unit,
          rescheduleFrom: rescheduleRule.from,
          archivedAt: null,
        })
        .returning({ id: tasks.id, scheduledDate: tasks.scheduledDate });

      return { completionId: completion.id, nextTask };
    });
  });
