import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const removeCommitmentGroupShareSchema = z.object({
  groupId: z.uuid(),
  sharedWithUserId: z.string(),
});

export const removeCommitmentGroupShare = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(removeCommitmentGroupShareSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [group] = await db
      .select({ ownerId: commitmentGroups.userId })
      .from(commitmentGroups)
      .where(eq(commitmentGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Commitment group not found');
    }

    await db
      .delete(commitmentGroupShares)
      .where(
        and(
          eq(commitmentGroupShares.groupId, data.groupId),
          eq(commitmentGroupShares.sharedWithUserId, data.sharedWithUserId),
        ),
      );
  });
