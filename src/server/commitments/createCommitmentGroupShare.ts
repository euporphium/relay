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
    const now = new Date();

    const [group] = await db
      .select({
        ownerId: commitmentGroups.userId,
        ownerEmail: user.email,
      })
      .from(commitmentGroups)
      .innerJoin(user, eq(commitmentGroups.userId, user.id))
      .where(eq(commitmentGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Commitment group not found');
    }

    if (group.ownerEmail.trim().toLowerCase() === email) {
      throw new Error('Cannot invite yourself');
    }

    const [targetUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(ilike(user.email, email));

    const [existingShare] = await db
      .select({
        id: commitmentGroupShares.id,
        status: commitmentGroupShares.status,
        sharedWithUserId: commitmentGroupShares.sharedWithUserId,
        invitedAt: commitmentGroupShares.invitedAt,
        respondedAt: commitmentGroupShares.respondedAt,
        acceptedAt: commitmentGroupShares.acceptedAt,
      })
      .from(commitmentGroupShares)
      .where(
        and(
          eq(commitmentGroupShares.groupId, data.groupId),
          eq(commitmentGroupShares.invitedEmail, email),
        ),
      );

    if (existingShare) {
      await db
        .update(commitmentGroupShares)
        .set({
          invitedByUserId: userId,
          invitedEmail: email,
          sharedWithUserId:
            existingShare.status === 'accepted'
              ? existingShare.sharedWithUserId
              : (targetUser?.id ?? null),
          permission: data.permission,
          status: existingShare.status === 'accepted' ? 'accepted' : 'pending',
          invitedAt:
            existingShare.status === 'accepted' ? existingShare.invitedAt : now,
          respondedAt:
            existingShare.status === 'accepted'
              ? existingShare.respondedAt
              : null,
          acceptedAt:
            existingShare.status === 'accepted'
              ? existingShare.acceptedAt
              : null,
          rejectedAt: null,
          revokedAt: null,
          leftAt: null,
          updatedAt: now,
        })
        .where(eq(commitmentGroupShares.id, existingShare.id));
      return {
        sharedWithUserId: targetUser?.id ?? existingShare.sharedWithUserId,
        status: existingShare.status === 'accepted' ? 'accepted' : 'pending',
      };
    }

    await db.insert(commitmentGroupShares).values({
      groupId: data.groupId,
      invitedByUserId: userId,
      invitedEmail: email,
      sharedWithUserId: targetUser?.id ?? null,
      permission: data.permission,
      status: 'pending',
      invitedAt: now,
    });

    return { sharedWithUserId: targetUser?.id ?? null, status: 'pending' };
  });
