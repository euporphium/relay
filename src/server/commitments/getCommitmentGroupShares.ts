import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups, user } from '@/db/schema';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { authMiddleware } from '@/server/middleware/auth';

export type CommitmentGroupShare = {
  userId: string;
  name: string;
  email: string;
  permission: SharePermission;
};

const getCommitmentGroupSharesSchema = z.object({
  groupId: z.uuid(),
});

export const getCommitmentGroupShares = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(getCommitmentGroupSharesSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [group] = await db
      .select({ ownerId: commitmentGroups.userId })
      .from(commitmentGroups)
      .where(eq(commitmentGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Commitment group not found');
    }

    const shares = await db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        permission: commitmentGroupShares.permission,
      })
      .from(commitmentGroupShares)
      .innerJoin(user, eq(commitmentGroupShares.sharedWithUserId, user.id))
      .where(eq(commitmentGroupShares.groupId, data.groupId))
      .orderBy(user.name, user.email);

    return { shares };
  });
