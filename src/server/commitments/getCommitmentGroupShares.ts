import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups, user } from '@/db/schema';
import type { ShareInvitationStatus } from '@/domain/share/shareInvitationStatuses';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { authMiddleware } from '@/server/middleware/auth';

export type CommitmentGroupShare = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  permission: SharePermission;
  status: ShareInvitationStatus;
  invitedAt: Date;
  acceptedAt: Date | null;
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
        id: commitmentGroupShares.id,
        userId: user.id,
        name: user.name,
        email: commitmentGroupShares.invitedEmail,
        permission: commitmentGroupShares.permission,
        status: commitmentGroupShares.status,
        invitedAt: commitmentGroupShares.invitedAt,
        acceptedAt: commitmentGroupShares.acceptedAt,
      })
      .from(commitmentGroupShares)
      .leftJoin(user, eq(commitmentGroupShares.sharedWithUserId, user.id))
      .where(
        and(
          eq(commitmentGroupShares.groupId, data.groupId),
          inArray(commitmentGroupShares.status, ['pending', 'accepted']),
        ),
      )
      .orderBy(commitmentGroupShares.invitedEmail);

    return {
      acceptedShares: shares.filter((share) => share.status === 'accepted'),
      pendingInvitations: shares
        .filter((share) => share.status === 'pending')
        .map((share) => ({
          ...share,
          // Pending invitations expose email only until recipient accepts.
          name: null,
        })),
    };
  });
