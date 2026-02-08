import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { commitmentGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const updateCommitmentGroupNameSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
});

export const updateCommitmentGroupName = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateCommitmentGroupNameSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const [existing] = await db
      .select({ id: commitmentGroups.id })
      .from(commitmentGroups)
      .where(
        and(
          eq(commitmentGroups.id, data.id),
          eq(commitmentGroups.userId, userId),
        ),
      );

    if (!existing) {
      throw new Error('Commitment group not found');
    }

    await db
      .update(commitmentGroups)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(commitmentGroups.id, data.id));
  });
