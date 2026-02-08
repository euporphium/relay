import { createServerFn } from '@tanstack/react-start';
import { and, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups, user } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const createCommitmentGroupShareSchema = z.object({
  groupId: z.uuid(),
  email: z.email(),
  permission: z.enum(['view', 'edit']),
});

export const createCommitmentGroupShare = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createCommitmentGroupShareSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const email = data.email.trim().toLowerCase();

    const [group] = await db
      .select({ ownerId: commitmentGroups.userId })
      .from(commitmentGroups)
      .where(eq(commitmentGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Commitment group not found');
    }

    const [targetUser] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(ilike(user.email, email));

    if (!targetUser || targetUser.id === group.ownerId) {
      throw new Error('User not found');
    }

    const [existingShare] = await db
      .select({ id: commitmentGroupShares.id })
      .from(commitmentGroupShares)
      .where(
        and(
          eq(commitmentGroupShares.groupId, data.groupId),
          eq(commitmentGroupShares.sharedWithUserId, targetUser.id),
        ),
      );

    if (existingShare) {
      await db
        .update(commitmentGroupShares)
        .set({ permission: data.permission, updatedAt: new Date() })
        .where(eq(commitmentGroupShares.id, existingShare.id));
      return { sharedWithUserId: targetUser.id };
    }

    await db.insert(commitmentGroupShares).values({
      groupId: data.groupId,
      sharedWithUserId: targetUser.id,
      permission: data.permission,
    });

    return { sharedWithUserId: targetUser.id };
  });
