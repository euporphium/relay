import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitments } from '@/db/schema';
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

      const activeById = new Map(rows.map((row) => [row.id, row]));

      if (data.orderedIds.length !== rows.length) {
        throw new Error('Commitment mismatch while reordering');
      }

      if (new Set(data.orderedIds).size !== data.orderedIds.length) {
        throw new Error('Commitment mismatch while reordering');
      }

      if (data.orderedIds.some((id) => !activeById.has(id))) {
        throw new Error('Commitment mismatch while reordering');
      }

      const now = new Date();

      for (const [index, id] of data.orderedIds.entries()) {
        await tx
          .update(commitments)
          .set({ position: index + 1, updatedAt: now })
          .where(and(eq(commitments.id, id), eq(commitments.userId, userId)));
      }
    });
  });
