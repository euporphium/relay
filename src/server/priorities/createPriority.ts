import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { priorities, priorityGroupShares, priorityGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';
import { priorityInputSchema } from '@/shared/validation/priorityInput.schema';

export const priorityPersistenceSchema = priorityInputSchema.transform(
  (value) => ({
    title: value.title.trim(),
    note: value.note?.trim() ?? undefined,
    groupId: value.groupId ?? undefined,
    groupName: value.groupName?.trim() || undefined,
  }),
);

export const createPriority = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(priorityPersistenceSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await db.transaction(async (tx) => {
      let groupId: string | null = null;
      let priorityOwnerId = userId;

      if (data.groupId) {
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
          .where(eq(priorityGroups.id, data.groupId));

        if (!group) {
          throw new Error('Priority group not found');
        }

        const canEdit = group.ownerId === userId || group.permission === 'edit';

        if (!canEdit) {
          throw new Error('Priority group not found');
        }

        groupId = group.id;
        priorityOwnerId = group.ownerId;
      } else if (data.groupName) {
        const existingGroup = await tx.query.priorityGroups.findFirst({
          where: and(
            eq(priorityGroups.userId, userId),
            eq(priorityGroups.name, data.groupName),
          ),
        });

        if (existingGroup) {
          groupId = existingGroup.id;
        } else {
          const [group] = await tx
            .insert(priorityGroups)
            .values({
              userId,
              name: data.groupName,
            })
            .returning({ id: priorityGroups.id });

          groupId = group?.id ?? null;
        }
      }

      const [positionRow] = await tx
        .select({
          max: sql<number>`max(${priorities.position})`,
        })
        .from(priorities)
        .where(
          and(
            eq(priorities.userId, priorityOwnerId),
            groupId
              ? eq(priorities.groupId, groupId)
              : isNull(priorities.groupId),
          ),
        );

      const nextPosition = (positionRow?.max ?? 0) + 1;

      await tx.insert(priorities).values({
        userId: priorityOwnerId,
        groupId,
        title: data.title,
        note: data.note,
        state: 'active',
        position: nextPosition,
      });
    });
  });
