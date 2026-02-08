import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitments } from '@/db/schema';
import { commitmentStates } from '@/domain/commitment/commitmentStates';
import { authMiddleware } from '@/server/middleware/auth';

const updateCommitmentStateSchema = z.object({
  id: z.string().uuid(),
  state: z.enum(commitmentStates),
});

export const updateCommitmentState = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateCommitmentStateSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    await db.transaction(async (tx) => {
      const existing = await tx.query.commitments.findFirst({
        where: and(eq(commitments.id, data.id), eq(commitments.userId, userId)),
      });

      if (!existing) {
        throw new Error('Commitment not found');
      }

      if (existing.state === data.state) {
        return;
      }

      let nextPosition: number | undefined;

      if (data.state === 'active') {
        const groupFilter = existing.groupId
          ? eq(commitments.groupId, existing.groupId)
          : isNull(commitments.groupId);

        const [positionRow] = await tx
          .select({
            max: sql<number>`max(${commitments.position})`,
          })
          .from(commitments)
          .where(
            and(
              eq(commitments.userId, userId),
              groupFilter,
              eq(commitments.state, 'active'),
            ),
          );

        nextPosition = (positionRow?.max ?? 0) + 1;
      }

      await tx
        .update(commitments)
        .set({
          state: data.state,
          updatedAt: new Date(),
          ...(nextPosition ? { position: nextPosition } : {}),
        })
        .where(eq(commitments.id, existing.id));
    });
  });
