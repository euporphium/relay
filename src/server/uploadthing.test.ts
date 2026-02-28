import { beforeEach, describe, expect, test, vi } from 'vitest';

const {
  getSessionMock,
  assertAttachmentOwnerAccessMock,
  buildAttachmentUploadNameMock,
  whereMock,
  fromMock,
  selectMock,
  valuesMock,
  insertMock,
} = vi.hoisted(() => {
  const whereMock = vi.fn();
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  const valuesMock = vi.fn();

  return {
    getSessionMock: vi.fn(),
    assertAttachmentOwnerAccessMock: vi.fn(),
    buildAttachmentUploadNameMock: vi.fn(),
    whereMock,
    fromMock,
    selectMock,
    valuesMock,
    insertMock: vi.fn(() => ({ values: valuesMock })),
  };
});

vi.mock('uploadthing/server', () => {
  class TestUploadThingError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UploadThingError';
    }
  }

  const UTFiles = Symbol('UTFiles');

  return {
    UploadThingError: TestUploadThingError,
    UTFiles,
    createUploadthing: () => (routeConfig: unknown) => {
      // biome-ignore lint/suspicious/noExplicitAny: 3rd party mock for testing 🤫
      const route: any = {
        routeConfig,
        _middleware: undefined as
          | undefined
          | ((args: {
              req: Request;
              files: readonly { name: string; size: number }[];
              input: {
                ownerType: 'task' | 'priority';
                ownerId: string;
                title?: string;
                note?: string;
              };
            }) => Promise<Record<string | symbol, unknown>>),
        _onUploadComplete: undefined as
          | undefined
          | ((args: {
              metadata: {
                attachmentId: string;
                userId: string;
                ownerType: 'task' | 'priority';
                ownerId: string;
                originalFileName: string;
                title?: string;
                note?: string;
              };
              file: {
                key: string;
                name: string;
                size: number;
                type: string;
                url?: string;
                ufsUrl?: string;
                appUrl?: string;
              };
            }) => Promise<void>),
        input: vi.fn().mockReturnThis(),
        middleware(fn: typeof route._middleware) {
          this._middleware = fn;
          return this;
        },
        onUploadComplete(fn: typeof route._onUploadComplete) {
          this._onUploadComplete = fn;
          return this;
        },
      };

      return route;
    },
  };
});

vi.mock('@/app/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('@/server/attachments/attachmentOwners', () => ({
  assertAttachmentOwnerAccess: assertAttachmentOwnerAccessMock,
}));

vi.mock('@/server/attachments/storageKeyPaths', () => ({
  buildAttachmentUploadName: buildAttachmentUploadNameMock,
}));

vi.mock('@/db', () => ({
  db: {
    select: selectMock,
    insert: insertMock,
  },
}));

vi.mock('@/db/schema', () => ({
  attachments: {
    id: 'id',
    userId: 'user_id',
    ownerType: 'owner_type',
    ownerId: 'owner_id',
    position: 'position',
    deletedAt: 'deleted_at',
    byteSize: 'byte_size',
    type: 'type',
    title: 'title',
    note: 'note',
    url: 'url',
    storageKey: 'storage_key',
    mimeType: 'mime_type',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}));

import { UploadThingError } from 'uploadthing/server';
import { uploadRouter } from '@/server/uploadthing';

const request = new Request('http://localhost/api/uploadthing');
const baseInput = {
  ownerType: 'task' as const,
  ownerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  title: 'Title',
  note: 'Note',
};

function getUploader(name: 'imageUploader' | 'fileUploader') {
  return uploadRouter[name] as unknown as {
    _middleware: (args: {
      req: Request;
      files: readonly { name: string; size: number }[];
      input: typeof baseInput;
    }) => Promise<Record<string | symbol, unknown>>;
    _onUploadComplete: (args: {
      metadata: {
        attachmentId: string;
        userId: string;
        ownerType: 'task' | 'priority';
        ownerId: string;
        originalFileName: string;
        title?: string;
        note?: string;
      };
      file: {
        key: string;
        name: string;
        size: number;
        type: string;
        url?: string;
        ufsUrl?: string;
        appUrl?: string;
      };
    }) => Promise<void>;
  };
}

beforeEach(() => {
  getSessionMock.mockReset();
  assertAttachmentOwnerAccessMock.mockReset();
  buildAttachmentUploadNameMock.mockReset();
  whereMock.mockReset();
  fromMock.mockClear();
  selectMock.mockClear();
  valuesMock.mockReset();
  insertMock.mockClear();

  getSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
  assertAttachmentOwnerAccessMock.mockResolvedValue(undefined);
  buildAttachmentUploadNameMock.mockImplementation(
    (attachmentId: string, fileName: string) => `${attachmentId}::${fileName}`,
  );
  valuesMock.mockResolvedValue(undefined);
});

describe('uploadRouter', () => {
  test('returns Unauthorized UploadThingError when session is missing', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const imageUploader = getUploader('imageUploader');

    await expect(
      imageUploader._middleware({
        req: request,
        files: [{ name: 'photo.png', size: 123 }],
        input: baseInput,
      }),
    ).rejects.toMatchObject({
      name: 'UploadThingError',
      message: 'Unauthorized',
    });

    expect(assertAttachmentOwnerAccessMock).not.toHaveBeenCalled();
  });

  test('returns storage limit message when user exceeds limit', async () => {
    whereMock.mockResolvedValueOnce([{ usedBytes: 250 * 1024 * 1024 }]);
    const imageUploader = getUploader('imageUploader');

    await expect(
      imageUploader._middleware({
        req: request,
        files: [{ name: 'large.png', size: 1 }],
        input: baseInput,
      }),
    ).rejects.toEqual(
      new UploadThingError(
        'Upload rejected: storage limit exceeded. Your account limit is 250MB.',
      ),
    );
  });

  test('persists the correct attachment type per uploader and remaps names', async () => {
    whereMock.mockResolvedValueOnce([{ usedBytes: 0 }]);
    whereMock.mockResolvedValueOnce([{ max: 2 }]);
    const imageUploader = getUploader('imageUploader');

    const imageMetadata = await imageUploader._middleware({
      req: request,
      files: [{ name: 'photo.png', size: 321 }],
      input: baseInput,
    });

    const imageAttachmentId = imageMetadata.attachmentId as string;
    expect(buildAttachmentUploadNameMock).toHaveBeenCalledWith(
      imageAttachmentId,
      'photo.png',
    );

    await imageUploader._onUploadComplete({
      metadata: {
        attachmentId: imageAttachmentId,
        userId: imageMetadata.userId as string,
        ownerType: imageMetadata.ownerType as 'task' | 'priority',
        ownerId: imageMetadata.ownerId as string,
        originalFileName: imageMetadata.originalFileName as string,
        title: imageMetadata.title as string | undefined,
        note: imageMetadata.note as string | undefined,
      },
      file: {
        key: 'key-image',
        name: 'photo.png',
        size: 321,
        type: 'image/png',
        ufsUrl: 'https://ufs.example/photo.png',
      },
    });

    expect(valuesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: imageAttachmentId,
        type: 'image',
        storageKey: 'key-image',
      }),
    );

    whereMock.mockResolvedValueOnce([{ usedBytes: 0 }]);
    whereMock.mockResolvedValueOnce([{ max: 5 }]);
    const fileUploader = getUploader('fileUploader');

    const fileMetadata = await fileUploader._middleware({
      req: request,
      files: [{ name: 'invoice.pdf', size: 1024 }],
      input: baseInput,
    });

    const fileAttachmentId = fileMetadata.attachmentId as string;
    expect(buildAttachmentUploadNameMock).toHaveBeenCalledWith(
      fileAttachmentId,
      'invoice.pdf',
    );

    await fileUploader._onUploadComplete({
      metadata: {
        attachmentId: fileAttachmentId,
        userId: fileMetadata.userId as string,
        ownerType: fileMetadata.ownerType as 'task' | 'priority',
        ownerId: fileMetadata.ownerId as string,
        originalFileName: fileMetadata.originalFileName as string,
        title: fileMetadata.title as string | undefined,
        note: fileMetadata.note as string | undefined,
      },
      file: {
        key: 'key-file',
        name: 'invoice.pdf',
        size: 1024,
        type: 'application/pdf',
        ufsUrl: 'https://ufs.example/invoice.pdf',
      },
    });

    expect(valuesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: fileAttachmentId,
        type: 'file',
        storageKey: 'key-file',
      }),
    );
  });
});
