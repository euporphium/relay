import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attachments, tasks } from '@/db/schema';
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

    const rows = (await db.query.tasks.findMany({
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
    })) as TaskForDate[];

    const taskIds = rows.map((row) => row.id);

    if (taskIds.length === 0) {
      return rows;
    }

    const taskAttachments = await db.query.attachments.findMany({
      where: and(
        eq(attachments.userId, userId),
        eq(attachments.ownerType, 'task'),
        inArray(attachments.ownerId, taskIds),
        isNull(attachments.deletedAt),
      ),
      orderBy: [asc(attachments.position), asc(attachments.createdAt)],
    });

    const attachmentsByTaskId = new Map<string, typeof taskAttachments>();
    for (const attachment of taskAttachments) {
      const list = attachmentsByTaskId.get(attachment.ownerId) ?? [];
      list.push(attachment);
      attachmentsByTaskId.set(attachment.ownerId, list);
    }

    return rows.map((row) => ({
      ...row,
      attachments: attachmentsByTaskId.get(row.id) ?? [],
    }));
  });
