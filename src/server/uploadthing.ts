import { and, eq, isNull, sql } from 'drizzle-orm';
import {
  createUploadthing,
  type FileRouter,
  UploadThingError,
  UTFiles,
} from 'uploadthing/server';
import { z } from 'zod';
import { auth } from '@/app/auth';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { assertAttachmentOwnerAccess } from '@/server/attachments/attachmentOwners';
import { buildAttachmentUploadName } from '@/server/attachments/storageKeyPaths';

const f = createUploadthing();

const USER_STORAGE_LIMIT_BYTES = 250 * 1024 * 1024;
const UNAUTHORIZED_MESSAGE = 'Unauthorized';
const STORAGE_LIMIT_MESSAGE =
  'Upload rejected: storage limit exceeded. Your account limit is 250MB.';

type UploadAttachmentType = 'image' | 'file';

const uploadInputSchema = z.object({
  ownerType: z.enum(['task', 'priority']),
  ownerId: z.uuid(),
  title: z.string().trim().max(500).optional(),
  note: z.string().trim().max(2000).optional(),
});

function getDisplayFileName(fileName: string) {
  return fileName.split('/').filter(Boolean).pop() ?? fileName;
}

function toUploadThingError(error: unknown) {
  if (error instanceof UploadThingError) {
    return error;
  }

  if (error instanceof Error) {
    return new UploadThingError(
      process.env.NODE_ENV === 'production'
        ? 'Failed to validate upload request.'
        : error.message,
    );
  }

  return new UploadThingError('Failed to validate upload request.');
}

async function buildUploadMetadata(params: {
  req: Request;
  files: readonly { name: string; size: number }[];
  input: z.infer<typeof uploadInputSchema>;
}) {
  const { req, files, input } = params;
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session?.user?.id;

  if (!userId) {
    throw new UploadThingError(UNAUTHORIZED_MESSAGE);
  }

  await assertAttachmentOwnerAccess({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    userId,
    requiredAccess: 'edit',
  });

  const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
  await assertStorageLimit(userId, incomingBytes);

  const attachmentId = crypto.randomUUID();

  return {
    attachmentId,
    userId,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    originalFileName: files[0]?.name ?? 'file',
    title: input.title,
    note: input.note,
  };
}

async function buildUploadMetadataOrThrowUploadThingError(
  params: Parameters<typeof buildUploadMetadata>[0],
) {
  try {
    return await buildUploadMetadata(params);
  } catch (error) {
    throw toUploadThingError(error);
  }
}

async function assertStorageLimit(userId: string, incomingBytes: number) {
  const [usageRow] = await db
    .select({
      usedBytes: sql<number>`coalesce(sum(${attachments.byteSize}), 0)::float8`,
    })
    .from(attachments)
    .where(and(eq(attachments.userId, userId), isNull(attachments.deletedAt)));

  const usedBytes = Number(usageRow?.usedBytes ?? 0);
  const currentUsageBytes = Number.isFinite(usedBytes) ? usedBytes : 0;
  if (currentUsageBytes + incomingBytes > USER_STORAGE_LIMIT_BYTES) {
    throw new UploadThingError(STORAGE_LIMIT_MESSAGE);
  }
}

function remapUtFiles(
  files: readonly { name: string; size: number }[],
  attachmentId: string,
) {
  return files.map((file) => ({
    ...file,
    customId: attachmentId,
    name: buildAttachmentUploadName(attachmentId, file.name),
  }));
}

async function createUploadedAttachment(params: {
  attachmentId: string;
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
  originalFileName: string;
  title?: string;
  note?: string;
}) {
  const {
    attachmentId,
    userId,
    ownerType,
    ownerId,
    type,
    file,
    originalFileName,
    title,
    note,
  } = params;

  const [positionRow] = await db
    .select({ max: sql<number>`max(${attachments.position})` })
    .from(attachments)
    .where(
      and(
        eq(attachments.ownerType, ownerType),
        eq(attachments.ownerId, ownerId),
        isNull(attachments.deletedAt),
      ),
    );

  const now = new Date();

  await db.insert(attachments).values({
    id: attachmentId,
    userId,
    ownerType,
    ownerId,
    type,
    title: title || getDisplayFileName(originalFileName),
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

function makeUploader(params: {
  routeConfig: Parameters<typeof f>[0];
  attachmentType: UploadAttachmentType;
}) {
  const { routeConfig, attachmentType } = params;

  return f(routeConfig)
    .input(uploadInputSchema)
    .middleware(async ({ req, files, input }) => {
      const metadata = await buildUploadMetadataOrThrowUploadThingError({
        req,
        files,
        input,
      });

      return {
        [UTFiles]: remapUtFiles(files, metadata.attachmentId),
        ...metadata,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await createUploadedAttachment({
        attachmentId: metadata.attachmentId,
        userId: metadata.userId,
        ownerType: metadata.ownerType,
        ownerId: metadata.ownerId,
        type: attachmentType,
        file,
        originalFileName: metadata.originalFileName,
        title: metadata.title,
        note: metadata.note,
      });
    });
}

export const uploadRouter = {
  imageUploader: makeUploader({
    routeConfig: {
      image: {
        maxFileSize: '4MB',
        maxFileCount: 1,
      },
    },
    attachmentType: 'image',
  }),

  fileUploader: makeUploader({
    routeConfig: {
      blob: {
        maxFileSize: '64MB',
        maxFileCount: 1,
      },
    },
    attachmentType: 'file',
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
