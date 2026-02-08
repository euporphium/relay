import { createServerFn } from '@tanstack/react-start';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { commitmentGroupShares, commitmentGroups } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const getCommitmentGroups = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    const groups = await db
      .select({
        id: commitmentGroups.id,
        name: commitmentGroups.name,
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
      .where(
        or(
          eq(commitmentGroups.userId, userId),
          eq(commitmentGroupShares.sharedWithUserId, userId),
        ),
      )
      .orderBy(commitmentGroups.name);

    return {
      groups: groups
        .filter((group) => {
          if (group.ownerId === userId) return true;
          return group.permission === 'edit';
        })
        .map((group) => ({
          id: group.id,
          name: group.name,
        })),
    };
  });
