import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups, user } from '@/db/schema';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { authMiddleware } from '@/server/middleware/auth';

export type PendingPriorityGroupInvitation = {
  invitationId: string;
  groupId: string;
  groupName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  permission: SharePermission;
  invitedAt: Date;
};

const getPendingPriorityGroupInvitationsSchema = z.object({});

export const getPendingPriorityGroupInvitations = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(getPendingPriorityGroupInvitationsSchema)
  .handler(async ({ context }) => {
    const { userId } = context;
    const now = new Date();

    const [currentUser] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, userId));

    if (!currentUser) {
      return { invitations: [] };
    }

    const normalizedEmail = currentUser.email.trim().toLowerCase();

    await db
      .update(priorityGroupShares)
      .set({
        sharedWithUserId: userId,
        updatedAt: now,
      })
      .where(
        and(
          eq(priorityGroupShares.status, 'pending'),
          eq(priorityGroupShares.invitedEmail, normalizedEmail),
          isNull(priorityGroupShares.sharedWithUserId),
        ),
      );

    const pendingRows = await db
      .select({
        invitationId: priorityGroupShares.id,
        groupId: priorityGroups.id,
        groupName: priorityGroups.name,
        ownerId: priorityGroups.userId,
        permission: priorityGroupShares.permission,
        invitedAt: priorityGroupShares.invitedAt,
      })
      .from(priorityGroupShares)
      .innerJoin(
        priorityGroups,
        eq(priorityGroupShares.groupId, priorityGroups.id),
      )
      .where(
        and(
          eq(priorityGroupShares.sharedWithUserId, userId),
          eq(priorityGroupShares.status, 'pending'),
        ),
      )
      .orderBy(priorityGroupShares.invitedAt);

    if (pendingRows.length === 0) {
      return { invitations: [] };
    }

    const ownerIds = [...new Set(pendingRows.map((row) => row.ownerId))];
    const owners = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(inArray(user.id, ownerIds));

    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

    return {
      invitations: pendingRows.flatMap((row) => {
        const owner = ownerById.get(row.ownerId);
        if (!owner) return [];
        return [
          {
            invitationId: row.invitationId,
            groupId: row.groupId,
            groupName: row.groupName,
            ownerId: row.ownerId,
            ownerName: owner.name,
            ownerEmail: owner.email,
            permission: row.permission,
            invitedAt: row.invitedAt,
          },
        ];
      }),
    };
  });
