import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  priorities,
  priorityGroupShares,
  priorityGroups,
  tasks,
} from '@/db/schema';
import type { AttachmentOwnerType } from '@/domain/attachment/attachmentOwnerTypes';

type RequiredAccess = 'view' | 'edit';

function canSatisfyAccess(params: {
  requiredAccess: RequiredAccess;
  canView: boolean;
  canEdit: boolean;
}) {
  if (params.requiredAccess === 'view') {
    return params.canView;
  }

  return params.canEdit;
}

export async function assertAttachmentOwnerAccess(input: {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  userId: string;
  requiredAccess?: RequiredAccess;
}) {
  const { ownerType, ownerId, userId, requiredAccess = 'edit' } = input;

  if (ownerType === 'task') {
    const owner = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, ownerId), eq(tasks.userId, userId)),
      columns: { id: true },
    });

    if (!owner) {
      throw new Error('Task not found');
    }

    return;
  }

  const [owner] = await db
    .select({
      id: priorities.id,
      priorityOwnerId: priorities.userId,
      groupId: priorities.groupId,
      groupOwnerId: priorityGroups.userId,
      sharePermission: priorityGroupShares.permission,
    })
    .from(priorities)
    .leftJoin(priorityGroups, eq(priorities.groupId, priorityGroups.id))
    .leftJoin(
      priorityGroupShares,
      and(
        eq(priorityGroupShares.groupId, priorityGroups.id),
        eq(priorityGroupShares.sharedWithUserId, userId),
        eq(priorityGroupShares.status, 'accepted'),
      ),
    )
    .where(eq(priorities.id, ownerId));

  if (!owner) {
    throw new Error('Priority not found');
  }

  if (owner.groupId === null) {
    const isOwner = owner.priorityOwnerId === userId;
    const canAccess = canSatisfyAccess({
      requiredAccess,
      canView: isOwner,
      canEdit: isOwner,
    });

    if (!canAccess) {
      throw new Error('Priority not found');
    }

    return;
  }

  const isGroupOwner = owner.groupOwnerId === userId;
  const hasViewShare =
    owner.sharePermission === 'view' || owner.sharePermission === 'edit';
  const canAccess = canSatisfyAccess({
    requiredAccess,
    canView: isGroupOwner || hasViewShare,
    canEdit: isGroupOwner || owner.sharePermission === 'edit',
  });

  if (!canAccess) {
    throw new Error('Priority not found');
  }
}
