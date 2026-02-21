import { createServerFn } from '@tanstack/react-start';
import { and, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, priorityGroups, user } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const createPriorityGroupShareSchema = z.object({
  groupId: z.uuid(),
  email: z.email(),
  permission: z.enum(['view', 'edit']),
});

export const createPriorityGroupShare = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createPriorityGroupShareSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const email = data.email.trim().toLowerCase();
    const now = new Date();

    const [group] = await db
      .select({
        ownerId: priorityGroups.userId,
        ownerEmail: user.email,
      })
      .from(priorityGroups)
      .innerJoin(user, eq(priorityGroups.userId, user.id))
      .where(eq(priorityGroups.id, data.groupId));

    if (!group || group.ownerId !== userId) {
      throw new Error('Priority group not found');
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
        id: priorityGroupShares.id,
        status: priorityGroupShares.status,
        sharedWithUserId: priorityGroupShares.sharedWithUserId,
        invitedAt: priorityGroupShares.invitedAt,
        respondedAt: priorityGroupShares.respondedAt,
        acceptedAt: priorityGroupShares.acceptedAt,
      })
      .from(priorityGroupShares)
      .where(
        and(
          eq(priorityGroupShares.groupId, data.groupId),
          eq(priorityGroupShares.invitedEmail, email),
        ),
      );

    if (existingShare) {
      await db
        .update(priorityGroupShares)
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
        .where(eq(priorityGroupShares.id, existingShare.id));
      return {
        sharedWithUserId: targetUser?.id ?? existingShare.sharedWithUserId,
        status: existingShare.status === 'accepted' ? 'accepted' : 'pending',
      };
    }

    await db.insert(priorityGroupShares).values({
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
