import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { priorities, tasks } from '@/db/schema';
import type { AttachmentOwnerType } from '@/domain/attachment/attachmentOwnerTypes';

export async function assertAttachmentOwnerBelongsToUser(input: {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  userId: string;
}) {
  const { ownerType, ownerId, userId } = input;

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

  const owner = await db.query.priorities.findFirst({
    where: and(eq(priorities.id, ownerId), eq(priorities.userId, userId)),
    columns: { id: true },
  });

  if (!owner) {
    throw new Error('Priority not found');
  }
}
