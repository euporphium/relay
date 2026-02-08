import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';
import type { TaskForDate } from '@/shared/types/task';

export const getTasksForDate = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.iso.date())
  .handler(async ({ data: targetDate, context }): Promise<TaskForDate[]> => {
    const { userId } = context;
    const previewStartDate = sql<Date>`
        ${tasks.scheduledDate}
        - (
          coalesce(${tasks.previewLeadTime}, 0)
        || ' '
        || coalesce(${tasks.previewUnit}, 'day')
        )::interval
    `;

    return db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, userId),
        isNull(tasks.resolvedAt),
        sql`${previewStartDate} <= ${targetDate}`,
      ),
      orderBy: tasks.scheduledDate,
      extras: {
        previewStartDate: previewStartDate.as('previewStartDate'),
        status: sql<'active' | 'upcoming'>`
          case
            when ${tasks.scheduledDate} <= ${targetDate}
              then 'active'
            else 'upcoming'
          end
        `.as('status'),
      },
    }) as Promise<TaskForDate[]>;
  });
