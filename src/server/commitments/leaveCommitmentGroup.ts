import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const leaveCommitmentGroupSchema = z.object({
  groupId: z.uuid(),
});

export const leaveCommitmentGroup = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(leaveCommitmentGroupSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const now = new Date();

    const [group] = await db
      .select({ ownerId: commitmentGroups.userId })
      .from(commitmentGroups)
      .where(eq(commitmentGroups.id, data.groupId));

    if (!group) {
      throw new Error('Commitment group not found');
    }

    if (group.ownerId === userId) {
      throw new Error('Owners cannot leave their own commitment group');
    }

    const [share] = await db
      .select({ id: commitmentGroupShares.id })
      .from(commitmentGroupShares)
      .where(
        and(
          eq(commitmentGroupShares.groupId, data.groupId),
          eq(commitmentGroupShares.sharedWithUserId, userId),
          eq(commitmentGroupShares.status, 'accepted'),
        ),
      );

    if (!share) {
      throw new Error('Share not found');
    }

    await db
      .update(commitmentGroupShares)
      .set({
        status: 'left',
        leftAt: now,
        respondedAt: now,
        updatedAt: now,
      })
      .where(eq(commitmentGroupShares.id, share.id));
  });
