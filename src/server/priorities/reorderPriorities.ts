import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorities, priorityGroupShares, priorityGroups } from '@/db/schema';
import { validatePriorityReorder } from '@/domain/priority/validatePriorityReorder';
import { authMiddleware } from '@/server/middleware/auth';

const reorderPrioritiesSchema = z.object({
  groupId: z.uuid().nullable(),
  orderedIds: z.array(z.uuid()).min(1),
});

export const reorderPriorities = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(reorderPrioritiesSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (data.groupId) {
      const [group] = await db
        .select({
          id: priorityGroups.id,
          ownerId: priorityGroups.userId,
          permission: priorityGroupShares.permission,
        })
        .from(priorityGroups)
        .leftJoin(
          priorityGroupShares,
          and(
            eq(priorityGroupShares.groupId, priorityGroups.id),
            eq(priorityGroupShares.sharedWithUserId, userId),
            eq(priorityGroupShares.status, 'accepted'),
          ),
        )
        .where(eq(priorityGroups.id, data.groupId));

      const canEdit =
        group && (group.ownerId === userId || group.permission === 'edit');

      if (!canEdit) {
        throw new Error('Priority group not found');
      }
    }

    const groupFilter = data.groupId
      ? eq(priorities.groupId, data.groupId)
      : isNull(priorities.groupId);

    await db.transaction(async (tx) => {
      const conditions = [groupFilter, eq(priorities.state, 'active')];
      if (!data.groupId) {
        conditions.push(eq(priorities.userId, userId));
      }
      const rows = await tx.query.priorities.findMany({
        where: and(...conditions),
      });

      validatePriorityReorder({
        orderedIds: data.orderedIds,
        activeIds: rows.map((row) => row.id),
      });

      const now = new Date();

      for (const [index, id] of data.orderedIds.entries()) {
        const updateConditions = [eq(priorities.id, id), groupFilter];
        if (!data.groupId) {
          updateConditions.push(eq(priorities.userId, userId));
        }
        await tx
          .update(priorities)
          .set({ position: index + 1, updatedAt: now })
          .where(and(...updateConditions));
      }
    });
  });
