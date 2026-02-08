import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { commitments } from '@/db/schema';
import type { CommitmentState } from '@/domain/commitment/commitmentStates';
import { authMiddleware } from '@/server/middleware/auth';

export type CommitmentItem = {
  id: string;
  title: string;
  note: string | null;
  state: CommitmentState;
  position: number;
  groupId: string | null;
  updatedAt: Date;
};

export type CommitmentGroup = {
  id: string | null;
  name: string;
  commitments: CommitmentItem[];
};

const UNGROUPED_NAME = 'Ungrouped';

export const getCommitments = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    const rows = await db.query.commitments.findMany({
      where: eq(commitments.userId, userId),
      orderBy: [commitments.groupId, commitments.position],
      with: { group: true },
    });

    const grouped = new Map<string | null, CommitmentGroup>();

    for (const row of rows) {
      const groupId = row.groupId ?? null;
      const groupName = row.group?.name ?? UNGROUPED_NAME;

      if (!grouped.has(groupId)) {
        grouped.set(groupId, {
          id: groupId,
          name: groupName,
          commitments: [],
        });
      }

      grouped.get(groupId)?.commitments.push({
        id: row.id,
        title: row.title,
        note: row.note ?? null,
        state: row.state,
        position: row.position,
        groupId,
        updatedAt: row.updatedAt,
      });
    }

    for (const group of grouped.values()) {
      const active = group.commitments
        .filter((commitment) => commitment.state === 'active')
        .sort((a, b) => a.position - b.position);
      const inactive = group.commitments
        .filter((commitment) => commitment.state !== 'active')
        .sort(
          (a, b) =>
            b.updatedAt.getTime() - a.updatedAt.getTime() ||
            a.title.localeCompare(b.title),
        );

      group.commitments = [...active, ...inactive];
    }

    const groups = [...grouped.values()].sort((a, b) => {
      if (a.id === null && b.id === null) return 0;
      if (a.id === null) return 1;
      if (b.id === null) return -1;
      return a.name.localeCompare(b.name);
    });

    return { groups };
  });
