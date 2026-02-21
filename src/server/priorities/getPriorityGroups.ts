import { createServerFn } from '@tanstack/react-start';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const getPriorityGroups = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    const groups = await db
      .select({
        id: priorityGroups.id,
        name: priorityGroups.name,
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
      .where(
        or(
          eq(priorityGroups.userId, userId),
          eq(priorityGroupShares.sharedWithUserId, userId),
        ),
      )
      .orderBy(priorityGroups.name);

    return {
      groups: groups
        .filter((group) => {
          if (group.ownerId === userId) return true;
          return group.permission === 'edit';
        })
        .map((group) => ({
          id: group.id,
          name: group.name,
        })),
    };
  });
