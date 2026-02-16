import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '@/db';
import {
  commitmentGroupShares,
  commitmentGroups,
  commitments,
} from '@/db/schema';
import { buildCommitmentGroups } from '@/domain/commitment/buildCommitmentGroups';
import { authMiddleware } from '@/server/middleware/auth';

export const getCommitments = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    const accessRows = await db
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
          eq(commitmentGroupShares.status, 'accepted'),
        ),
      )
      .where(
        or(
          eq(commitmentGroups.userId, userId),
          eq(commitmentGroupShares.sharedWithUserId, userId),
        ),
      );

    const accessByGroupId = new Map(
      accessRows.flatMap((row) => {
        const isOwner = row.ownerId === userId;
        const permission = isOwner ? 'edit' : row.permission;
        if (!permission) return [];
        return [
          [
            row.id,
            {
              isOwner,
              canEdit: isOwner || permission === 'edit',
              permission,
            },
          ] as const,
        ];
      }),
    );

    const accessibleGroupIds = [...accessByGroupId.keys()];

    const filters = [];
    if (accessibleGroupIds.length > 0) {
      filters.push(inArray(commitments.groupId, accessibleGroupIds));
    }
    filters.push(
      and(isNull(commitments.groupId), eq(commitments.userId, userId)),
    );

    const rows = await db.query.commitments.findMany({
      where: filters.length === 1 ? filters[0] : or(...filters),
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
        access: row.groupId
          ? (accessByGroupId.get(row.groupId) ?? undefined)
          : undefined,
        updatedAt: row.updatedAt,
      })),
    );

    return { groups };
  });
