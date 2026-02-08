import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  commitmentGroupShares,
  commitmentGroups,
  commitments,
} from '@/db/schema';
import { buildCommitmentUpdatePlan } from '@/domain/commitment/buildCommitmentUpdatePlan';
import { authMiddleware } from '@/server/middleware/auth';
import { commitmentPersistenceSchema } from '@/server/commitments/createCommitment';

export const updateCommitment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.uuid(),
      updates: commitmentPersistenceSchema,
    }),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: commitments.id,
          userId: commitments.userId,
          groupId: commitments.groupId,
          state: commitments.state,
          groupOwnerId: commitmentGroups.userId,
          sharePermission: commitmentGroupShares.permission,
        })
        .from(commitments)
        .leftJoin(
          commitmentGroups,
          eq(commitments.groupId, commitmentGroups.id),
        )
        .leftJoin(
          commitmentGroupShares,
          and(
            eq(commitmentGroupShares.groupId, commitmentGroups.id),
            eq(commitmentGroupShares.sharedWithUserId, userId),
          ),
        )
        .where(eq(commitments.id, data.id));

      if (!existing) {
        throw new Error('Commitment not found');
      }

      if (existing.groupId === null) {
        if (existing.userId !== userId) {
          throw new Error('Commitment not found');
        }
      } else {
        const canEdit =
          existing.groupOwnerId === userId ||
          existing.sharePermission === 'edit';
        if (!canEdit) {
          throw new Error('Commitment not found');
        }
      }

      let nextGroupId: string | null = null;
      let commitmentOwnerId = existing.userId;

      if (data.updates.groupId) {
        const [group] = await tx
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
            ),
          )
          .where(eq(commitmentGroups.id, data.updates.groupId));

        if (!group) {
          throw new Error('Commitment group not found');
        }

        const canEdit = group.ownerId === userId || group.permission === 'edit';

        if (!canEdit) {
          throw new Error('Commitment group not found');
        }

        nextGroupId = group.id;
        commitmentOwnerId = group.ownerId;
      } else if (data.updates.groupName) {
        const existingGroup = await tx.query.commitmentGroups.findFirst({
          where: and(
            eq(commitmentGroups.userId, userId),
            eq(commitmentGroups.name, data.updates.groupName),
          ),
        });

        if (existingGroup) {
          nextGroupId = existingGroup.id;
        } else {
          const [group] = await tx
            .insert(commitmentGroups)
            .values({
              userId,
              name: data.updates.groupName,
            })
            .returning({
              id: commitmentGroups.id,
            });

          nextGroupId = group?.id ?? null;
        }

        commitmentOwnerId = userId;
      }

      const now = new Date();
      let plan = buildCommitmentUpdatePlan({
        currentGroupId: existing.groupId,
        currentState: existing.state,
        nextGroupId,
        nextOwnerId: commitmentOwnerId,
        title: data.updates.title,
        note: data.updates.note,
        now,
      });

      if (plan.needsPosition) {
        const groupFilter = nextGroupId
          ? eq(commitments.groupId, nextGroupId)
          : isNull(commitments.groupId);
        const stateFilter =
          plan.positionScope === 'active'
            ? eq(commitments.state, 'active')
            : undefined;

        const [positionRow] = await tx
          .select({
            max: sql<number>`max(${commitments.position})`,
          })
          .from(commitments)
          .where(
            and(
              eq(commitments.userId, commitmentOwnerId),
              groupFilter,
              ...(stateFilter ? [stateFilter] : []),
            ),
          );

        plan = buildCommitmentUpdatePlan({
          currentGroupId: existing.groupId,
          currentState: existing.state,
          nextGroupId,
          nextOwnerId: commitmentOwnerId,
          title: data.updates.title,
          note: data.updates.note,
          now,
          nextPosition: (positionRow?.max ?? 0) + 1,
        });
      }

      await tx
        .update(commitments)
        .set(plan.update)
        .where(eq(commitments.id, data.id));
    });
  });
