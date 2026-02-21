import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { priorities, priorityGroupShares, priorityGroups } from '@/db/schema';
import { buildPriorityUpdatePlan } from '@/domain/priority/buildPriorityUpdatePlan';
import { authMiddleware } from '@/server/middleware/auth';
import { priorityPersistenceSchema } from '@/server/priorities/createPriority';

export const updatePriority = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.uuid(),
      updates: priorityPersistenceSchema,
    }),
  )
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

      let nextGroupId: string | null = null;
      let priorityOwnerId = existing.userId;

      if (data.updates.groupId) {
        const [group] = await tx
          .select({
            id: priorityGroups.id,
            ownerId: priorityGroups.userId,
            permission: priorityGroupShares.permission,
          })
          .from(priorityGroups)
          .leftJoin(
            priorityGroupShares,
            and(
              eq(priorityGroupShares.groupId, priorityGroups.id),
              eq(priorityGroupShares.sharedWithUserId, userId),
              eq(priorityGroupShares.status, 'accepted'),
            ),
          )
          .where(eq(priorityGroups.id, data.updates.groupId));

        if (!group) {
          throw new Error('Priority group not found');
        }

        const canEdit = group.ownerId === userId || group.permission === 'edit';

        if (!canEdit) {
          throw new Error('Priority group not found');
        }

        nextGroupId = group.id;
        priorityOwnerId = group.ownerId;
      } else if (data.updates.groupName) {
        const existingGroup = await tx.query.priorityGroups.findFirst({
          where: and(
            eq(priorityGroups.userId, userId),
            eq(priorityGroups.name, data.updates.groupName),
          ),
        });

        if (existingGroup) {
          nextGroupId = existingGroup.id;
        } else {
          const [group] = await tx
            .insert(priorityGroups)
            .values({
              userId,
              name: data.updates.groupName,
            })
            .returning({
              id: priorityGroups.id,
            });

          nextGroupId = group?.id ?? null;
        }

        priorityOwnerId = userId;
      }

      const now = new Date();
      let plan = buildPriorityUpdatePlan({
        currentGroupId: existing.groupId,
        currentState: existing.state,
        nextGroupId,
        nextOwnerId: priorityOwnerId,
        title: data.updates.title,
        note: data.updates.note,
        now,
      });

      if (plan.needsPosition) {
        const groupFilter = nextGroupId
          ? eq(priorities.groupId, nextGroupId)
          : isNull(priorities.groupId);
        const stateFilter =
          plan.positionScope === 'active'
            ? eq(priorities.state, 'active')
            : undefined;

        const [positionRow] = await tx
          .select({
            max: sql<number>`max(${priorities.position})`,
          })
          .from(priorities)
          .where(
            and(
              eq(priorities.userId, priorityOwnerId),
              groupFilter,
              ...(stateFilter ? [stateFilter] : []),
            ),
          );

        plan = buildPriorityUpdatePlan({
          currentGroupId: existing.groupId,
          currentState: existing.state,
          nextGroupId,
          nextOwnerId: priorityOwnerId,
          title: data.updates.title,
          note: data.updates.note,
          now,
          nextPosition: (positionRow?.max ?? 0) + 1,
        });
      }

      await tx
        .update(priorities)
        .set(plan.update)
        .where(eq(priorities.id, data.id));
    });
  });
