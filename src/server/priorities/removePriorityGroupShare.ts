import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const removePriorityGroupShareSchema = z.object({
  groupId: z.uuid(),
  shareId: z.uuid(),
});

export const removePriorityGroupShare = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(removePriorityGroupShareSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const now = new Date();

    const [group] = await db
      .select({ ownerId: priorityGroups.userId })
      .from(priorityGroups)
      .where(eq(priorityGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Priority group not found');
    }

    await db
      .update(priorityGroupShares)
      .set({
        status: 'revoked',
        revokedAt: now,
        respondedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(priorityGroupShares.groupId, data.groupId),
          eq(priorityGroupShares.id, data.shareId),
          inArray(priorityGroupShares.status, ['pending', 'accepted']),
        ),
      );
  });
