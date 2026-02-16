import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups, user } from '@/db/schema';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { authMiddleware } from '@/server/middleware/auth';

export type PendingCommitmentGroupInvitation = {
  invitationId: string;
  groupId: string;
  groupName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  permission: SharePermission;
  invitedAt: Date;
};

const getPendingCommitmentGroupInvitationsSchema = z.object({});

export const getPendingCommitmentGroupInvitations = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(getPendingCommitmentGroupInvitationsSchema)
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
      .update(commitmentGroupShares)
      .set({
        sharedWithUserId: userId,
        updatedAt: now,
      })
      .where(
        and(
          eq(commitmentGroupShares.status, 'pending'),
          eq(commitmentGroupShares.invitedEmail, normalizedEmail),
          isNull(commitmentGroupShares.sharedWithUserId),
        ),
      );

    const pendingRows = await db
      .select({
        invitationId: commitmentGroupShares.id,
        groupId: commitmentGroups.id,
        groupName: commitmentGroups.name,
        ownerId: commitmentGroups.userId,
        permission: commitmentGroupShares.permission,
        invitedAt: commitmentGroupShares.invitedAt,
      })
      .from(commitmentGroupShares)
      .innerJoin(
        commitmentGroups,
        eq(commitmentGroupShares.groupId, commitmentGroups.id),
      )
      .where(
        and(
          eq(commitmentGroupShares.sharedWithUserId, userId),
          eq(commitmentGroupShares.status, 'pending'),
        ),
      )
      .orderBy(commitmentGroupShares.invitedAt);

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
