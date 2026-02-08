import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitments } from '@/db/schema';
import { buildCommitmentStateUpdatePlan } from '@/domain/commitment/buildCommitmentStateUpdatePlan';
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

      const now = new Date();
      let plan = buildCommitmentStateUpdatePlan({
        currentState: existing.state,
        nextState: data.state,
        now,
      });

      if (!plan.shouldUpdate || !plan.update) {
        return;
      }

      if (plan.needsPosition) {
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

        const nextPosition = (positionRow?.max ?? 0) + 1;

        plan = buildCommitmentStateUpdatePlan({
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
        .update(commitments)
        .set(plan.update)
        .where(eq(commitments.id, existing.id));
    });
  });
