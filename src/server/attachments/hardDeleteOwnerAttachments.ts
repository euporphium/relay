import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import type { AttachmentOwnerType } from '@/domain/attachment/attachmentOwnerTypes';
import { utApi } from '@/server/attachments/utApi';

type Transaction = Parameters<typeof db.transaction>[0] extends (
  tx: infer Tx,
) => Promise<unknown>
  ? Tx
  : never;

export async function hardDeleteOwnerAttachmentsAndRunInTransaction(input: {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  runInTransaction: (tx: Transaction) => Promise<void>;
}) {
  const ownerAttachments = await db
    .select({
      type: attachments.type,
      storageKey: attachments.storageKey,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.ownerType, input.ownerType),
        eq(attachments.ownerId, input.ownerId),
      ),
    );

  const storageKeys = [
    ...new Set(
      ownerAttachments.flatMap((attachment) =>
        (attachment.type === 'image' || attachment.type === 'file') &&
        attachment.storageKey
          ? [attachment.storageKey]
          : [],
      ),
    ),
  ];

  if (storageKeys.length > 0) {
    await utApi.deleteFiles(storageKeys);
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(attachments)
      .where(
        and(
          eq(attachments.ownerType, input.ownerType),
          eq(attachments.ownerId, input.ownerId),
        ),
      );

    await input.runInTransaction(tx);
  });
}
