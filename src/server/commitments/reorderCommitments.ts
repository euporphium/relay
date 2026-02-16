import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  commitmentGroupShares,
  commitmentGroups,
  commitments,
} from '@/db/schema';
import { validateCommitmentReorder } from '@/domain/commitment/validateCommitmentReorder';
import { authMiddleware } from '@/server/middleware/auth';

const reorderCommitmentsSchema = z.object({
  groupId: z.uuid().nullable(),
  orderedIds: z.array(z.uuid()).min(1),
});

export const reorderCommitments = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(reorderCommitmentsSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (data.groupId) {
      const [group] = await db
        .select({
          id: commitmentGroups.id,
          ownerId: commitmentGroups.userId,
          permission: commitmentGroupShares.permission,
        })
        .from(commitmentGroups)
        .leftJoin(
          commitmentGroupShares,
          and(
            eq(commitmentGroupShares.groupId, commitmentGroups.id),
            eq(commitmentGroupShares.sharedWithUserId, userId),
            eq(commitmentGroupShares.status, 'accepted'),
          ),
        )
        .where(eq(commitmentGroups.id, data.groupId));

      const canEdit =
        group && (group.ownerId === userId || group.permission === 'edit');

      if (!canEdit) {
        throw new Error('Commitment group not found');
      }
    }

    const groupFilter = data.groupId
      ? eq(commitments.groupId, data.groupId)
      : isNull(commitments.groupId);

    await db.transaction(async (tx) => {
      const conditions = [groupFilter, eq(commitments.state, 'active')];
      if (!data.groupId) {
        conditions.push(eq(commitments.userId, userId));
      }
      const rows = await tx.query.commitments.findMany({
        where: and(...conditions),
      });

      validateCommitmentReorder({
        orderedIds: data.orderedIds,
        activeIds: rows.map((row) => row.id),
      });

      const now = new Date();

      for (const [index, id] of data.orderedIds.entries()) {
        const updateConditions = [eq(commitments.id, id), groupFilter];
        if (!data.groupId) {
          updateConditions.push(eq(commitments.userId, userId));
        }
        await tx
          .update(commitments)
          .set({ position: index + 1, updatedAt: now })
          .where(and(...updateConditions));
      }
    });
  });
