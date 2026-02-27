import {
  ArrowDownIcon,
  ArrowsClockwiseIcon,
  ArrowUpIcon,
  FileIcon,
  ImageIcon,
  PaperclipIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadDropzone } from '@/lib/uploadthing/client';
import { cn } from '@/lib/utils/cn';
import { createAttachment } from '@/server/attachments/createAttachment';
import { deleteAttachment } from '@/server/attachments/deleteAttachment';
import { getAttachmentsByOwner } from '@/server/attachments/getAttachmentsByOwner';
import { refreshAttachmentMetadata } from '@/server/attachments/refreshAttachmentMetadata';
import { reorderAttachments } from '@/server/attachments/reorderAttachments';
import type { Attachment } from '@/shared/types/attachment';

type AttachmentSectionProps = {
  ownerType: 'task' | 'priority';
  ownerId?: string;
  initialAttachments?: Attachment[];
};

type ComposerType = 'link' | 'image' | 'file';

function moveInArray<T>(items: T[], fromIndex: number, toIndex: number) {
  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);

  if (!moved) {
    return items;
  }

  copy.splice(toIndex, 0, moved);
  return copy;
}

function formatBytes(value: number | null) {
  if (!value) {
    return null;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)}KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)}MB`;
}

function getAttachmentLabel(attachment: Attachment) {
  return attachment.title || attachment.url || attachment.type;
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.type === 'image' && attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="block overflow-hidden rounded-md border border-border/70 bg-muted/20"
      >
        <img
          src={attachment.url}
          alt={attachment.title ?? 'Uploaded image'}
          className="w-full object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (
    attachment.type === 'link' &&
    attachment.url &&
    attachment.previewImageUrl
  ) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="block overflow-hidden rounded-md border border-border/70 bg-muted/20"
      >
        <img
          src={attachment.previewImageUrl}
          alt={attachment.title ?? 'Link preview image'}
          className="w-full object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  return null;
}

export function AttachmentSection({
  ownerType,
  ownerId,
  initialAttachments,
}: AttachmentSectionProps) {
  const createAttachmentFn = useServerFn(createAttachment);
  const getAttachmentsFn = useServerFn(getAttachmentsByOwner);
  const deleteAttachmentFn = useServerFn(deleteAttachment);
  const reorderAttachmentsFn = useServerFn(reorderAttachments);
  const refreshAttachmentMetadataFn = useServerFn(refreshAttachmentMetadata);

  const [attachments, setAttachments] = useState<Attachment[]>(
    initialAttachments ?? [],
  );
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [activeComposer, setActiveComposer] = useState<ComposerType | null>(
    null,
  );
  const [isRefreshingById, setIsRefreshingById] = useState<
    Record<string, boolean>
  >({});
  const canManage = ownerId != null;

  useEffect(() => {
    setAttachments(initialAttachments ?? []);
  }, [initialAttachments]);

  const sortedAttachments = useMemo(
    () => [...attachments].sort((a, b) => a.position - b.position),
    [attachments],
  );

  async function reloadAttachments() {
    if (!ownerId) {
      return;
    }

    const next = await getAttachmentsFn({
      data: { ownerType, ownerId },
    });

    setAttachments(next);
  }

  async function handleAddLink() {
    if (!ownerId || !urlInput.trim()) {
      return;
    }

    setIsAddingLink(true);

    try {
      const attachment = await createAttachmentFn({
        data: {
          ownerType,
          ownerId,
          type: 'link',
          url: urlInput.trim(),
          title: titleInput.trim() || undefined,
          note: noteInput.trim() || undefined,
        },
      });

      setAttachments((current) => [...current, attachment]);
      setUrlInput('');
      setTitleInput('');
      setNoteInput('');
      toast.success('Link attachment added');
    } catch {
      toast.error('Failed to add link attachment');
    } finally {
      setIsAddingLink(false);
    }
  }

  async function handleMove(attachmentId: string, direction: 'up' | 'down') {
    if (!ownerId) {
      return;
    }

    const currentIndex = sortedAttachments.findIndex(
      (attachment) => attachment.id === attachmentId,
    );

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= sortedAttachments.length) {
      return;
    }

    const reordered = moveInArray(
      sortedAttachments,
      currentIndex,
      nextIndex,
    ).map((attachment, index) => ({
      ...attachment,
      position: index,
    }));

    const previous = sortedAttachments;
    setAttachments(reordered);

    try {
      await reorderAttachmentsFn({
        data: {
          ownerType,
          ownerId,
          orderedIds: reordered.map((attachment) => attachment.id),
        },
      });
    } catch {
      setAttachments(previous);
      toast.error('Failed to reorder attachments');
    }
  }

  async function handleRemove(attachment: Attachment) {
    const isUploaded =
      attachment.type === 'image' || attachment.type === 'file';

    if (isUploaded) {
      const confirmed = confirm(
        'Remove this uploaded file? This will also delete the stored file.',
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      await deleteAttachmentFn({ data: attachment.id });
      setAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );
      toast.success('Attachment removed');
    } catch {
      toast.error('Failed to remove attachment');
    }
  }

  async function handleRefreshMetadata(attachmentId: string) {
    setIsRefreshingById((current) => ({ ...current, [attachmentId]: true }));

    try {
      const updated = await refreshAttachmentMetadataFn({ data: attachmentId });
      setAttachments((current) =>
        current.map((attachment) =>
          attachment.id === updated.id ? updated : attachment,
        ),
      );
      toast.success('Link metadata refreshed');
    } catch {
      toast.error('Failed to refresh metadata');
    } finally {
      setIsRefreshingById((current) => ({ ...current, [attachmentId]: false }));
    }
  }

  const uploadAppearance = {
    container: 'mx-auto rounded-xl border p-4',
    uploadIcon: 'text-primary/80 w-12',
    label: 'text-sm font-medium text-foreground',
    allowedContent: 'text-xs text-muted-foreground',
    button: buttonVariants(),
  };

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Attachments</h3>
        <p className="text-xs text-muted-foreground">
          Add links, images, and files to give this item context.
        </p>
      </div>

      {!ownerId ? (
        <p className="text-xs text-muted-foreground">
          Save first, then attach links and files.
        </p>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeComposer === 'link' ? 'default' : 'outline'}
              onClick={() =>
                setActiveComposer((current) =>
                  current === 'link' ? null : 'link',
                )
              }
              aria-pressed={activeComposer === 'link'}
              className="justify-center gap-2"
            >
              <PaperclipIcon size={16} />
              <span className="text-xs sm:text-sm">Link</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeComposer === 'image' ? 'default' : 'outline'}
              onClick={() =>
                setActiveComposer((current) =>
                  current === 'image' ? null : 'image',
                )
              }
              aria-pressed={activeComposer === 'image'}
              className="justify-center gap-2"
            >
              <ImageIcon size={16} />
              <span className="text-xs sm:text-sm">Image</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeComposer === 'file' ? 'default' : 'outline'}
              onClick={() =>
                setActiveComposer((current) =>
                  current === 'file' ? null : 'file',
                )
              }
              aria-pressed={activeComposer === 'file'}
              className="justify-center gap-2"
            >
              <FileIcon size={16} />
              <span className="text-xs sm:text-sm">File</span>
            </Button>
          </div>

          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              activeComposer
                ? 'mt-2 max-h-168 opacity-100'
                : 'max-h-0 opacity-0',
            )}
          >
            {activeComposer === 'link' ? (
              <FieldSet className="mt-2">
                <FieldGroup className="gap-4">
                  <Field className="gap-2">
                    <FieldLabel htmlFor="attachment-url">URL</FieldLabel>
                    <Input
                      id="attachment-url"
                      value={urlInput}
                      onChange={(event) => setUrlInput(event.target.value)}
                      placeholder="https://example.com"
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="attachment-title">Title</FieldLabel>
                    <Input
                      id="attachment-title"
                      value={titleInput}
                      onChange={(event) => setTitleInput(event.target.value)}
                      placeholder="Optional title"
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="attachment-note">Note</FieldLabel>
                    <Textarea
                      id="attachment-note"
                      value={noteInput}
                      onChange={(event) => setNoteInput(event.target.value)}
                      placeholder="Optional note"
                    />
                  </Field>
                </FieldGroup>
                <Button
                  type="button"
                  onClick={() => void handleAddLink()}
                  disabled={isAddingLink || !urlInput.trim()}
                >
                  {isAddingLink ? 'Adding...' : 'Add link'}
                </Button>
              </FieldSet>
            ) : null}

            {activeComposer === 'image' ? (
              <UploadDropzone
                endpoint="imageUploader"
                input={{ ownerType, ownerId }}
                onClientUploadComplete={() => void reloadAttachments()}
                onUploadError={(error) => {
                  toast.error(error.message);
                }}
                config={{ cn }}
                appearance={uploadAppearance}
              />
            ) : null}

            {activeComposer === 'file' ? (
              <UploadDropzone
                endpoint="fileUploader"
                input={{ ownerType, ownerId }}
                onClientUploadComplete={() => void reloadAttachments()}
                onUploadError={(error) => {
                  toast.error(error.message);
                }}
                config={{ cn }}
                appearance={uploadAppearance}
              />
            ) : null}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {sortedAttachments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No attachments yet.</p>
        ) : (
          sortedAttachments.map((attachment, index) => (
            <div
              key={attachment.id}
              className="flex h-full flex-col rounded-lg border border-border/70 bg-card p-3 sm:p-4"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="min-w-0 space-y-2">
                  <AttachmentPreview attachment={attachment} />
                  <p className="text-sm font-medium min-w-0 wrap-break-word">
                    {attachment.type === 'link' && attachment.url ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                        className="underline-offset-2 hover:underline focus-visible:underline"
                      >
                        {getAttachmentLabel(attachment)}
                      </a>
                    ) : (
                      getAttachmentLabel(attachment)
                    )}
                  </p>
                  {attachment.type === 'link' && attachment.url ? (
                    <p className="text-xs text-muted-foreground min-w-0 wrap-break-word">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                        className="underline-offset-2 hover:underline focus-visible:underline"
                      >
                        {attachment.url}
                      </a>
                    </p>
                  ) : null}
                  {attachment.description ? (
                    <p className="text-xs text-muted-foreground min-w-0 wrap-break-word">
                      {attachment.description}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{attachment.type}</span>
                    {attachment.byteSize ? (
                      <span>{formatBytes(attachment.byteSize)}</span>
                    ) : null}
                  </div>
                </div>

                {canManage ? (
                  <div className="mt-auto flex items-center justify-end gap-1 border-t border-border/50 pt-2">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => void handleMove(attachment.id, 'up')}
                      disabled={index === 0}
                      aria-label="Move attachment up"
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => void handleMove(attachment.id, 'down')}
                      disabled={index === sortedAttachments.length - 1}
                      aria-label="Move attachment down"
                    >
                      <ArrowDownIcon />
                    </Button>
                    {attachment.type === 'link' ? (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        onClick={() =>
                          void handleRefreshMetadata(attachment.id)
                        }
                        disabled={Boolean(isRefreshingById[attachment.id])}
                        aria-label="Refresh link metadata"
                      >
                        <ArrowsClockwiseIcon />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => void handleRemove(attachment)}
                      aria-label="Remove attachment"
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
