import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  commitmentGroupShares,
  commitmentGroups,
  commitments,
} from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const getCommitment = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.uuid())
  .handler(async ({ data: id, context }) => {
    const { userId } = context;

    const [existing] = await db
      .select({
        id: commitments.id,
        userId: commitments.userId,
        title: commitments.title,
        note: commitments.note,
        state: commitments.state,
        position: commitments.position,
        groupId: commitments.groupId,
        updatedAt: commitments.updatedAt,
        groupOwnerId: commitmentGroups.userId,
        sharePermission: commitmentGroupShares.permission,
      })
      .from(commitments)
      .leftJoin(commitmentGroups, eq(commitments.groupId, commitmentGroups.id))
      .leftJoin(
        commitmentGroupShares,
        and(
          eq(commitmentGroupShares.groupId, commitmentGroups.id),
          eq(commitmentGroupShares.sharedWithUserId, userId),
          eq(commitmentGroupShares.status, 'accepted'),
        ),
      )
      .where(eq(commitments.id, id));

    if (!existing) {
      return null;
    }

    if (existing.groupId === null) {
      return existing.userId === userId ? existing : null;
    }

    const canEdit =
      existing.groupOwnerId === userId || existing.sharePermission === 'edit';

    return canEdit ? existing : null;
  });
