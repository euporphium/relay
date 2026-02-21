import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorityGroupShares, user } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const respondToPriorityGroupInvitationSchema = z.object({
  invitationId: z.uuid(),
  decision: z.enum(['accept', 'reject']),
});

export const respondToPriorityGroupInvitation = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(respondToPriorityGroupInvitationSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const now = new Date();
    const [currentUser] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, userId));

    if (!currentUser) {
      throw new Error('Unauthorized');
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
          eq(priorityGroupShares.id, data.invitationId),
          eq(priorityGroupShares.status, 'pending'),
          eq(priorityGroupShares.invitedEmail, normalizedEmail),
          isNull(priorityGroupShares.sharedWithUserId),
        ),
      );

    const [invitation] = await db
      .select({
        id: priorityGroupShares.id,
        groupId: priorityGroupShares.groupId,
      })
      .from(priorityGroupShares)
      .where(
        and(
          eq(priorityGroupShares.id, data.invitationId),
          eq(priorityGroupShares.sharedWithUserId, userId),
          eq(priorityGroupShares.status, 'pending'),
        ),
      );

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (data.decision === 'accept') {
      await db
        .update(priorityGroupShares)
        .set({
          status: 'accepted',
          acceptedAt: now,
          respondedAt: now,
          rejectedAt: null,
          revokedAt: null,
          leftAt: null,
          updatedAt: now,
        })
        .where(eq(priorityGroupShares.id, invitation.id));
    } else {
      await db
        .update(priorityGroupShares)
        .set({
          status: 'rejected',
          rejectedAt: now,
          respondedAt: now,
          acceptedAt: null,
          updatedAt: now,
        })
        .where(eq(priorityGroupShares.id, invitation.id));
    }

    return { groupId: invitation.groupId };
  });
