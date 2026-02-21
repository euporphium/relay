import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorities, priorityGroupShares, priorityGroups } from '@/db/schema';
import { buildPriorityStateUpdatePlan } from '@/domain/priority/buildPriorityStateUpdatePlan';
import { priorityStates } from '@/domain/priority/priorityStates';
import { authMiddleware } from '@/server/middleware/auth';

const updatePriorityStateSchema = z.object({
  id: z.uuid(),
  state: z.enum(priorityStates),
});

export const updatePriorityState = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePriorityStateSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: priorities.id,
          userId: priorities.userId,
          groupId: priorities.groupId,
          state: priorities.state,
          groupOwnerId: priorityGroups.userId,
          sharePermission: priorityGroupShares.permission,
        })
        .from(priorities)
        .leftJoin(priorityGroups, eq(priorities.groupId, priorityGroups.id))
        .leftJoin(
          priorityGroupShares,
          and(
            eq(priorityGroupShares.groupId, priorityGroups.id),
            eq(priorityGroupShares.sharedWithUserId, userId),
            eq(priorityGroupShares.status, 'accepted'),
          ),
        )
        .where(eq(priorities.id, data.id));

      if (!existing) {
        throw new Error('Priority not found');
      }

      if (existing.groupId === null) {
        if (existing.userId !== userId) {
          throw new Error('Priority not found');
        }
      } else {
        const canEdit =
          existing.groupOwnerId === userId ||
          existing.sharePermission === 'edit';
        if (!canEdit) {
          throw new Error('Priority not found');
        }
      }

      const priorityOwnerId =
        existing.groupId === null
          ? existing.userId
          : (existing.groupOwnerId ?? existing.userId);

      const now = new Date();
      let plan = buildPriorityStateUpdatePlan({
        currentState: existing.state,
        nextState: data.state,
        now,
      });

      if (!plan.shouldUpdate || !plan.update) {
        return;
      }

      if (plan.needsPosition) {
        const groupFilter = existing.groupId
          ? eq(priorities.groupId, existing.groupId)
          : isNull(priorities.groupId);

        const [positionRow] = await tx
          .select({
            max: sql<number>`max(${priorities.position})`,
          })
          .from(priorities)
          .where(
            and(
              eq(priorities.userId, priorityOwnerId),
              groupFilter,
              eq(priorities.state, 'active'),
            ),
          );

        const nextPosition = (positionRow?.max ?? 0) + 1;

        plan = buildPriorityStateUpdatePlan({
          currentState: existing.state,
          nextState: data.state,
          now,
          nextPosition,
        });
      }

      if (!plan.update) {
        return;
      }

      await tx
        .update(priorities)
        .set(plan.update)
        .where(eq(priorities.id, existing.id));
    });
  });
