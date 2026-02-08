import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { commitmentGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';
import type { CommitmentGroupOption } from '@/shared/types/commitment';

export const getCommitmentGroups = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    const groups = await db.query.commitmentGroups.findMany({
      where: eq(commitmentGroups.userId, userId),
      orderBy: [commitmentGroups.name],
    });

    return {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
      })),
    };
  });
