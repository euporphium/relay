import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups, user } from '@/db/schema';
import type { ShareInvitationStatus } from '@/domain/share/shareInvitationStatuses';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { authMiddleware } from '@/server/middleware/auth';

export type PriorityGroupShare = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  permission: SharePermission;
  status: ShareInvitationStatus;
  invitedAt: Date;
  acceptedAt: Date | null;
};

const getPriorityGroupSharesSchema = z.object({
  groupId: z.uuid(),
});

export const getPriorityGroupShares = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(getPriorityGroupSharesSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [group] = await db
      .select({ ownerId: priorityGroups.userId })
      .from(priorityGroups)
      .where(eq(priorityGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Priority group not found');
    }

    const shares = await db
      .select({
        id: priorityGroupShares.id,
        userId: user.id,
        name: user.name,
        email: priorityGroupShares.invitedEmail,
        permission: priorityGroupShares.permission,
        status: priorityGroupShares.status,
        invitedAt: priorityGroupShares.invitedAt,
        acceptedAt: priorityGroupShares.acceptedAt,
      })
      .from(priorityGroupShares)
      .leftJoin(user, eq(priorityGroupShares.sharedWithUserId, user.id))
      .where(
        and(
          eq(priorityGroupShares.groupId, data.groupId),
          inArray(priorityGroupShares.status, ['pending', 'accepted']),
        ),
      )
      .orderBy(priorityGroupShares.invitedEmail);

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
