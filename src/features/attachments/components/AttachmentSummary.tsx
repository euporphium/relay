import {
  CaretDownIcon,
  FileIcon,
  FilePdfIcon,
  GlobeSimpleIcon,
  ImageIcon,
  LinkSimpleIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Attachment } from '@/shared/types/attachment';

type AttachmentSummaryProps = {
  attachments?: Attachment[];
};

function getFileIcon(mimeType: string | null) {
  if (!mimeType) {
    return FileIcon;
  }

  if (mimeType.includes('pdf')) {
    return FilePdfIcon;
  }

  return FileIcon;
}

export function AttachmentSummary({
  attachments = [],
}: AttachmentSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (attachments.length === 0) {
    return null;
  }

  const orderedAttachments = [...attachments].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="my-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <CaretDownIcon
            size={14}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
          <span>Attachments ({orderedAttachments.length})</span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="flex flex-col gap-2 text-xs text-muted-foreground">
        {orderedAttachments.map((attachment) => {
          if (attachment.type === 'link') {
            const label =
              attachment.title || attachment.domain || attachment.url || 'Link';
            const domain = attachment.domain || '';

            return (
              <div key={attachment.id} className="flex items-center gap-2">
                <LinkSimpleIcon
                  size={14}
                  className="shrink-0 text-foreground"
                />
                <a
                  href={attachment.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden rounded-full border border-border/60 bg-muted/40 px-2 py-1"
                >
                  {attachment.previewImageUrl ? (
                    <span className="h-4 w-4 shrink-0 rounded-sm border border-border/60 bg-muted/40">
                      <img
                        src={attachment.previewImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </span>
                  ) : domain ? (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
                      alt=""
                      className="h-3.5 w-3.5 shrink-0 rounded-sm"
                    />
                  ) : (
                    <GlobeSimpleIcon size={12} className="shrink-0" />
                  )}
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {label}
                  </span>
                </a>
              </div>
            );
          }

          if (attachment.type === 'image') {
            return (
              <div key={attachment.id} className="flex items-center gap-2">
                <ImageIcon size={14} className="shrink-0 text-foreground" />
                <span
                  className="h-8 w-8 overflow-hidden rounded border border-border/60 bg-muted/40"
                  title={attachment.title ?? undefined}
                >
                  {attachment.url ? (
                    <img
                      src={attachment.url}
                      alt={attachment.title ?? 'Attachment image'}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </span>
              </div>
            );
          }

          const FileTypeIcon = getFileIcon(attachment.mimeType);
          const label = attachment.title || attachment.url || 'File';

          return (
            <div key={attachment.id} className="flex items-center gap-2">
              <FileIcon size={14} className="shrink-0 text-foreground" />
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-1 overflow-hidden">
                <FileTypeIcon size={12} className="text-foreground" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {label}
                </span>
              </span>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
