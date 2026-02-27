import { and, eq, isNull, sql } from 'drizzle-orm';
import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { z } from 'zod';
import { auth } from '@/app/auth';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { assertAttachmentOwnerBelongsToUser } from '@/server/attachments/attachmentOwners';

const f = createUploadthing();

const USER_STORAGE_LIMIT_BYTES = 250 * 1024 * 1024;
const uploadInputSchema = z.object({
  ownerType: z.enum(['task', 'priority']),
  ownerId: z.uuid(),
  title: z.string().trim().max(500).optional(),
  note: z.string().trim().max(2000).optional(),
});

type UploadInput = {
  ownerType: 'task' | 'priority';
  ownerId: string;
  title?: string;
  note?: string;
};

async function assertStorageLimit(userId: string, incomingBytes: number) {
  const [usageRow] = await db
    .select({
      usedBytes: sql<number>`coalesce(sum(${attachments.byteSize}), 0)`,
    })
    .from(attachments)
    .where(and(eq(attachments.userId, userId), isNull(attachments.deletedAt)));

  const usedBytes = usageRow?.usedBytes ?? 0;
  if (usedBytes + incomingBytes > USER_STORAGE_LIMIT_BYTES) {
    throw new Error(
      'Upload rejected: storage limit exceeded. Your account limit is 250MB.',
    );
  }
}

async function createUploadedAttachment(params: {
  userId: string;
  ownerType: 'task' | 'priority';
  ownerId: string;
  type: 'image' | 'file';
  file: {
    key: string;
    name: string;
    size: number;
    type: string;
    url?: string;
    ufsUrl?: string;
    appUrl?: string;
  };
  title?: string;
  note?: string;
}) {
  const { userId, ownerType, ownerId, type, file, title, note } = params;

  const [positionRow] = await db
    .select({ max: sql<number>`max(${attachments.position})` })
    .from(attachments)
    .where(
      and(
        eq(attachments.userId, userId),
        eq(attachments.ownerType, ownerType),
        eq(attachments.ownerId, ownerId),
        isNull(attachments.deletedAt),
      ),
    );

  const now = new Date();

  await db.insert(attachments).values({
    userId,
    ownerType,
    ownerId,
    type,
    title: title || file.name,
    note: note || null,
    position: (positionRow?.max ?? -1) + 1,
    url: file.ufsUrl || file.url || file.appUrl || null,
    storageKey: file.key,
    mimeType: file.type || null,
    byteSize: file.size,
    createdAt: now,
    updatedAt: now,
  });
}

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .input(uploadInputSchema)
    .middleware(async ({ req, files, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error('Unauthorized');
      }

      await assertAttachmentOwnerBelongsToUser({
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        userId,
      });

      const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
      await assertStorageLimit(userId, incomingBytes);

      return {
        userId,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        title: input.title,
        note: input.note,
      } satisfies UploadInput & { userId: string };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await createUploadedAttachment({
        userId: metadata.userId,
        ownerType: metadata.ownerType,
        ownerId: metadata.ownerId,
        type: 'image',
        file,
        title: metadata.title,
        note: metadata.note,
      });
    }),

  fileUploader: f({
    blob: {
      maxFileSize: '64MB',
      maxFileCount: 1,
    },
  })
    .input(uploadInputSchema)
    .middleware(async ({ req, files, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error('Unauthorized');
      }

      await assertAttachmentOwnerBelongsToUser({
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        userId,
      });

      const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
      await assertStorageLimit(userId, incomingBytes);

      return {
        userId,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        title: input.title,
        note: input.note,
      } satisfies UploadInput & { userId: string };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await createUploadedAttachment({
        userId: metadata.userId,
        ownerType: metadata.ownerType,
        ownerId: metadata.ownerId,
        type: 'file',
        file,
        title: metadata.title,
        note: metadata.note,
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
