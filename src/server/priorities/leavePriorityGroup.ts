import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const leavePriorityGroupSchema = z.object({
  groupId: z.uuid(),
});

export const leavePriorityGroup = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(leavePriorityGroupSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const now = new Date();

    const [group] = await db
      .select({ ownerId: priorityGroups.userId })
      .from(priorityGroups)
      .where(eq(priorityGroups.id, data.groupId));

    if (!group) {
      throw new Error('Priority group not found');
    }

    if (group.ownerId === userId) {
      throw new Error('Owners cannot leave their own priority group');
    }

    const [share] = await db
      .select({ id: priorityGroupShares.id })
      .from(priorityGroupShares)
      .where(
        and(
          eq(priorityGroupShares.groupId, data.groupId),
          eq(priorityGroupShares.sharedWithUserId, userId),
          eq(priorityGroupShares.status, 'accepted'),
        ),
      );

    if (!share) {
      throw new Error('Share not found');
    }

    await db
      .update(priorityGroupShares)
      .set({
        status: 'left',
        leftAt: now,
        respondedAt: now,
        updatedAt: now,
      })
      .where(eq(priorityGroupShares.id, share.id));
  });
