import { format, parseISO } from 'date-fns';
import type { ReactNode } from 'react';
import { AttachmentSummary } from '@/features/attachments/components/AttachmentSummary';
import type { TaskForDate } from '@/shared/types/task';

type TaskContentProps = {
  task: TaskForDate;
  actions?: ReactNode;
};

export function TaskContent({ task, actions }: TaskContentProps) {
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
        <h3 className="min-w-0 wrap-break-word text-sm font-semibold self-center">
          {task.name}
        </h3>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {task.note && (
        <p className="min-w-0 wrap-break-word text-sm text-muted-foreground">
          {task.note}
        </p>
      )}

      {task.scheduledDate && (
        <p className="text-xs text-muted-foreground">
          {format(parseISO(task.scheduledDate), 'EEE, MMM d')}
        </p>
      )}

      <AttachmentSummary attachments={task.attachments} />
    </div>
  );
}
