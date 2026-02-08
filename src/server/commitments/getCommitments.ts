import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { commitments } from '@/db/schema';
import { buildCommitmentGroups } from '@/domain/commitment/buildCommitmentGroups';
import { authMiddleware } from '@/server/middleware/auth';

export const getCommitments = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    const rows = await db.query.commitments.findMany({
      where: eq(commitments.userId, userId),
      orderBy: [commitments.groupId, commitments.position],
      with: { group: true },
    });

    const groups = buildCommitmentGroups(
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        note: row.note ?? null,
        state: row.state,
        position: row.position,
        groupId: row.groupId ?? null,
        groupName: row.group?.name ?? null,
        updatedAt: row.updatedAt,
      })),
    );

    return { groups };
  });
