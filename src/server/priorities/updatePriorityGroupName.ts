import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const updatePriorityGroupNameSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
});

export const updatePriorityGroupName = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePriorityGroupNameSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

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
      .where(eq(priorityGroups.id, data.id));

    const canEdit =
      group && (group.ownerId === userId || group.permission === 'edit');

    if (!canEdit) {
      throw new Error('Priority group not found');
    }

    await db
      .update(priorityGroups)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(priorityGroups.id, data.id));
  });
