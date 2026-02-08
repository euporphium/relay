import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const updateCommitmentGroupShareSchema = z.object({
  groupId: z.uuid(),
  sharedWithUserId: z.string(),
  permission: z.enum(['view', 'edit']),
});

export const updateCommitmentGroupShare = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateCommitmentGroupShareSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [group] = await db
      .select({ ownerId: commitmentGroups.userId })
      .from(commitmentGroups)
      .where(eq(commitmentGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Commitment group not found');
    }

    const [existingShare] = await db
      .select({ id: commitmentGroupShares.id })
      .from(commitmentGroupShares)
      .where(
        and(
          eq(commitmentGroupShares.groupId, data.groupId),
          eq(commitmentGroupShares.sharedWithUserId, data.sharedWithUserId),
        ),
      );

    if (!existingShare) {
      throw new Error('Share not found');
    }

    await db
      .update(commitmentGroupShares)
      .set({ permission: data.permission, updatedAt: new Date() })
      .where(eq(commitmentGroupShares.id, existingShare.id));
  });
