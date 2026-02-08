import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitments } from '@/db/schema';
import { validateCommitmentReorder } from '@/domain/commitment/validateCommitmentReorder';
import { authMiddleware } from '@/server/middleware/auth';

const reorderCommitmentsSchema = z.object({
  groupId: z.string().uuid().nullable(),
  orderedIds: z.array(z.string().uuid()).min(1),
});

export const reorderCommitments = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(reorderCommitmentsSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const groupFilter = data.groupId
      ? eq(commitments.groupId, data.groupId)
      : isNull(commitments.groupId);

    await db.transaction(async (tx) => {
      const rows = await tx.query.commitments.findMany({
        where: and(
          eq(commitments.userId, userId),
          groupFilter,
          eq(commitments.state, 'active'),
        ),
      });

      validateCommitmentReorder({
        orderedIds: data.orderedIds,
        activeIds: rows.map((row) => row.id),
      });

      const now = new Date();

      for (const [index, id] of data.orderedIds.entries()) {
        await tx
          .update(commitments)
          .set({ position: index + 1, updatedAt: now })
          .where(and(eq(commitments.id, id), eq(commitments.userId, userId)));
      }
    });
  });
