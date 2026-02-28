import {
  FileIcon,
  FilePdfIcon,
  GlobeSimpleIcon,
  ImageIcon,
  LinkSimpleIcon,
} from '@phosphor-icons/react';
import type { Attachment } from '@/shared/types/attachment';
import { buildAttachmentSummary } from './buildAttachmentSummary';

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

function trimLabel(label: string, maxLength: number) {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength - 1)}…`;
}

export function AttachmentSummary({ attachments }: AttachmentSummaryProps) {
  const summary = buildAttachmentSummary(attachments);

  if (summary.total === 0) {
    return null;
  }

  const previewImages = summary.images.slice(0, 3);
  const remainingImageCount = summary.images.length - previewImages.length;

  return (
    <div className="mt-2 space-y-2">
      {summary.links.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LinkSimpleIcon size={14} className="text-foreground" />
          {summary.links.slice(0, 3).map((link) => {
            const label = link.title || link.domain || link.url || 'Link';
            const domain = link.domain || '';

            return (
              <a
                key={link.id}
                href={link.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-1 whitespace-nowrap overflow-hidden"
              >
                {link.previewImageUrl ? (
                  <span className="h-4 w-4 rounded-sm border border-border/60 bg-muted/40">
                    <img
                      src={link.previewImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                ) : domain ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
                    alt=""
                    className="h-3.5 w-3.5 rounded-sm"
                  />
                ) : (
                  <GlobeSimpleIcon size={12} />
                )}
                <span className="text-ellipsis overflow-hidden">{label}</span>
              </a>
            );
          })}
          {summary.links.length > 3 ? (
            <span>+{summary.links.length - 3} more</span>
          ) : null}
        </div>
      ) : null}

      {summary.images.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon size={14} className="text-foreground" />
          <div className="flex items-center gap-1">
            {previewImages.map((image) => (
              <span
                key={image.id}
                className="h-8 w-8 overflow-hidden rounded border border-border/60 bg-muted/40"
                title={image.title ?? undefined}
              >
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.title ?? 'Attachment image'}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>
            ))}
            {remainingImageCount > 0 ? (
              <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[11px]">
                +{remainingImageCount} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {summary.files.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {summary.files.slice(0, 3).map((file) => {
            const Icon = getFileIcon(file.mimeType);
            const label = file.title || file.url || 'File';
            return (
              <span
                key={file.id}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-1"
              >
                <Icon size={12} className="text-foreground" />
                <span>{trimLabel(label, 28)}</span>
              </span>
            );
          })}
          {summary.files.length > 3 ? (
            <span>+{summary.files.length - 3} more</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
