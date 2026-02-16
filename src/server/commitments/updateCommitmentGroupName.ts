import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const updateCommitmentGroupNameSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
});

export const updateCommitmentGroupName = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateCommitmentGroupNameSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [group] = await db
      .select({
        id: commitmentGroups.id,
        ownerId: commitmentGroups.userId,
        permission: commitmentGroupShares.permission,
      })
      .from(commitmentGroups)
      .leftJoin(
        commitmentGroupShares,
        and(
          eq(commitmentGroupShares.groupId, commitmentGroups.id),
          eq(commitmentGroupShares.sharedWithUserId, userId),
          eq(commitmentGroupShares.status, 'accepted'),
        ),
      )
      .where(eq(commitmentGroups.id, data.id));

    const canEdit =
      group && (group.ownerId === userId || group.permission === 'edit');

    if (!canEdit) {
      throw new Error('Commitment group not found');
    }

    await db
      .update(commitmentGroups)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(commitmentGroups.id, data.id));
  });
