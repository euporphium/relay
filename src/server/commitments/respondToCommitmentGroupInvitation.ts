import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroupShares, user } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

const respondToCommitmentGroupInvitationSchema = z.object({
  invitationId: z.uuid(),
  decision: z.enum(['accept', 'reject']),
});

export const respondToCommitmentGroupInvitation = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(respondToCommitmentGroupInvitationSchema)
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
      .update(commitmentGroupShares)
      .set({
        sharedWithUserId: userId,
        updatedAt: now,
      })
      .where(
        and(
          eq(commitmentGroupShares.id, data.invitationId),
          eq(commitmentGroupShares.status, 'pending'),
          eq(commitmentGroupShares.invitedEmail, normalizedEmail),
          isNull(commitmentGroupShares.sharedWithUserId),
        ),
      );

    const [invitation] = await db
      .select({
        id: commitmentGroupShares.id,
        groupId: commitmentGroupShares.groupId,
      })
      .from(commitmentGroupShares)
      .where(
        and(
          eq(commitmentGroupShares.id, data.invitationId),
          eq(commitmentGroupShares.sharedWithUserId, userId),
          eq(commitmentGroupShares.status, 'pending'),
        ),
      );

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (data.decision === 'accept') {
      await db
        .update(commitmentGroupShares)
        .set({
          status: 'accepted',
          acceptedAt: now,
          respondedAt: now,
          rejectedAt: null,
          revokedAt: null,
          leftAt: null,
          updatedAt: now,
        })
        .where(eq(commitmentGroupShares.id, invitation.id));
    } else {
      await db
        .update(commitmentGroupShares)
        .set({
          status: 'rejected',
          rejectedAt: now,
          respondedAt: now,
          acceptedAt: null,
          updatedAt: now,
        })
        .where(eq(commitmentGroupShares.id, invitation.id));
    }

    return { groupId: invitation.groupId };
  });
