import { createServerFn } from '@tanstack/react-start';
import { and, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';

export const getTasksForDate = createServerFn()
  .inputValidator(z.iso.date())
  .handler(async ({ data: targetDate }) => {
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
        isNull(tasks.archivedAt),
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
    });
  });
