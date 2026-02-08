import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  commitmentGroupShares,
  commitmentGroups,
  commitments,
} from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';
import { commitmentInputSchema } from '@/shared/validation/commitmentInput.schema';

export const commitmentPersistenceSchema = commitmentInputSchema.transform(
  (value) => ({
    title: value.title.trim(),
    note: value.note?.trim() ?? undefined,
    groupId: value.groupId ?? undefined,
    groupName: value.groupName?.trim() || undefined,
  }),
);

export const createCommitment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(commitmentPersistenceSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await db.transaction(async (tx) => {
      let groupId: string | null = null;
      let commitmentOwnerId = userId;

      if (data.groupId) {
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
          .where(eq(commitmentGroups.id, data.groupId));

        if (!group) {
          throw new Error('Commitment group not found');
        }

        const canEdit = group.ownerId === userId || group.permission === 'edit';

        if (!canEdit) {
          throw new Error('Commitment group not found');
        }

        groupId = group.id;
        commitmentOwnerId = group.ownerId;
      } else if (data.groupName) {
        const existingGroup = await tx.query.commitmentGroups.findFirst({
          where: and(
            eq(commitmentGroups.userId, userId),
            eq(commitmentGroups.name, data.groupName),
          ),
        });

        if (existingGroup) {
          groupId = existingGroup.id;
        } else {
          const [group] = await tx
            .insert(commitmentGroups)
            .values({
              userId,
              name: data.groupName,
            })
            .returning({ id: commitmentGroups.id });

          groupId = group?.id ?? null;
        }
      }

      const [positionRow] = await tx
        .select({
          max: sql<number>`max(${commitments.position})`,
        })
        .from(commitments)
        .where(
          and(
            eq(commitments.userId, commitmentOwnerId),
            groupId
              ? eq(commitments.groupId, groupId)
              : isNull(commitments.groupId),
          ),
        );

      const nextPosition = (positionRow?.max ?? 0) + 1;

      await tx.insert(commitments).values({
        userId: commitmentOwnerId,
        groupId,
        title: data.title,
        note: data.note,
        state: 'active',
        position: nextPosition,
      });
    });
  });
