import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '@/db';
import {
  priorities,
  priorityGroupShares,
  priorityGroups,
  user,
} from '@/db/schema';
import { buildPriorityGroups } from '@/domain/priority/buildPriorityGroups';
import { authMiddleware } from '@/server/middleware/auth';

export const getPriorities = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    const accessRows = await db
      .select({
        id: priorityGroups.id,
        name: priorityGroups.name,
        ownerId: priorityGroups.userId,
        ownerName: user.name,
        permission: priorityGroupShares.permission,
      })
      .from(priorityGroups)
      .innerJoin(user, eq(user.id, priorityGroups.userId))
      .leftJoin(
        priorityGroupShares,
        and(
          eq(priorityGroupShares.groupId, priorityGroups.id),
          eq(priorityGroupShares.sharedWithUserId, userId),
          eq(priorityGroupShares.status, 'accepted'),
        ),
      )
      .where(
        or(
          eq(priorityGroups.userId, userId),
          eq(priorityGroupShares.sharedWithUserId, userId),
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
              sharedByName: isOwner ? null : row.ownerName,
            },
          ] as const,
        ];
      }),
    );

    const accessibleGroupIds = [...accessByGroupId.keys()];

    const filters = [];
    if (accessibleGroupIds.length > 0) {
      filters.push(inArray(priorities.groupId, accessibleGroupIds));
    }
    filters.push(
      and(isNull(priorities.groupId), eq(priorities.userId, userId)),
    );

    const rows = await db.query.priorities.findMany({
      where: filters.length === 1 ? filters[0] : or(...filters),
      orderBy: [priorities.groupId, priorities.position],
      with: { group: true },
    });

    const groups = buildPriorityGroups(
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
