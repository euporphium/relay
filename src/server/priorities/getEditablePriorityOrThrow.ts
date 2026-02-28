import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { priorities, priorityGroupShares, priorityGroups } from '@/db/schema';

type Transaction = Parameters<typeof db.transaction>[0] extends (
  tx: infer Tx,
) => Promise<unknown>
  ? Tx
  : never;

type PriorityQueryDb = typeof db | Transaction;

export async function getEditablePriorityOrThrow(input: {
  priorityId: string;
  userId: string;
  queryDb?: PriorityQueryDb;
}) {
  const queryDb = input.queryDb ?? db;

  const [existing] = await queryDb
    .select({
      id: priorities.id,
      userId: priorities.userId,
      groupId: priorities.groupId,
      state: priorities.state,
      groupOwnerId: priorityGroups.userId,
      sharePermission: priorityGroupShares.permission,
    })
    .from(priorities)
    .leftJoin(priorityGroups, eq(priorities.groupId, priorityGroups.id))
    .leftJoin(
      priorityGroupShares,
      and(
        eq(priorityGroupShares.groupId, priorityGroups.id),
        eq(priorityGroupShares.sharedWithUserId, input.userId),
        eq(priorityGroupShares.status, 'accepted'),
      ),
    )
    .where(eq(priorities.id, input.priorityId));

  if (!existing) {
    throw new Error('Priority not found');
  }

  if (existing.groupId === null) {
    if (existing.userId !== input.userId) {
      throw new Error('Priority not found');
    }
  } else {
    const canEdit =
      existing.groupOwnerId === input.userId ||
      existing.sharePermission === 'edit';
    if (!canEdit) {
      throw new Error('Priority not found');
    }
  }

  return existing;
}
