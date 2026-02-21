import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const updatePriorityGroupShareSchema = z.object({
  groupId: z.uuid(),
  shareId: z.uuid(),
  permission: z.enum(['view', 'edit']),
});

export const updatePriorityGroupShare = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePriorityGroupShareSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [group] = await db
      .select({ ownerId: priorityGroups.userId })
      .from(priorityGroups)
      .where(eq(priorityGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Priority group not found');
    }

    const [existingShare] = await db
      .select({ id: priorityGroupShares.id })
      .from(priorityGroupShares)
      .where(
        and(
          eq(priorityGroupShares.groupId, data.groupId),
          eq(priorityGroupShares.id, data.shareId),
          inArray(priorityGroupShares.status, ['pending', 'accepted']),
        ),
      );

    if (!existingShare) {
      throw new Error('Share not found');
    }

    await db
      .update(priorityGroupShares)
      .set({ permission: data.permission, updatedAt: new Date() })
      .where(eq(priorityGroupShares.id, existingShare.id));
  });
