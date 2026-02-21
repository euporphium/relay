import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorities, priorityGroupShares, priorityGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const getPriority = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.uuid())
  .handler(async ({ data: id, context }) => {
    const { userId } = context;

    const [existing] = await db
      .select({
        id: priorities.id,
        userId: priorities.userId,
        title: priorities.title,
        note: priorities.note,
        state: priorities.state,
        position: priorities.position,
        groupId: priorities.groupId,
        updatedAt: priorities.updatedAt,
        groupOwnerId: priorityGroups.userId,
        sharePermission: priorityGroupShares.permission,
      })
      .from(priorities)
      .leftJoin(priorityGroups, eq(priorities.groupId, priorityGroups.id))
      .leftJoin(
        priorityGroupShares,
        and(
          eq(priorityGroupShares.groupId, priorityGroups.id),
          eq(priorityGroupShares.sharedWithUserId, userId),
          eq(priorityGroupShares.status, 'accepted'),
        ),
      )
      .where(eq(priorities.id, id));

    if (!existing) {
      return null;
    }

    if (existing.groupId === null) {
      return existing.userId === userId ? existing : null;
    }

    const canEdit =
      existing.groupOwnerId === userId || existing.sharePermission === 'edit';

    return canEdit ? existing : null;
  });
