import { CheckIcon, PencilIcon, SkipForwardIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { TaskForDate } from '@/shared/types/task';
import { IconButton } from './IconButton';
import { TaskContent } from './TaskContent';

export type TaskActions = {
  complete?: (taskId: string) => void;
  skip?: (taskId: string) => void;
  edit: (taskId: string) => void;
};

type TaskRowProps = {
  task: TaskForDate;
  actions: TaskActions;
};

export function TaskRow({ task, actions }: TaskRowProps) {
  const { complete, skip, edit } = actions;

  const canComplete = task.status === 'active' && complete;
  const canSkip = task.status === 'active' && skip;

  return (
    <div
      className={cn(
        'flex items-center gap-4 md:gap-6 rounded-lg border p-4',
        'hover:bg-muted/40 transition-colors',
      )}
    >
      {canComplete && (
        <IconButton label="Complete task" onClick={() => complete(task.id)}>
          <CheckIcon />
        </IconButton>
      )}

      <TaskContent task={task} />

      {canSkip && (
        <IconButton label="Skip task" onClick={() => skip(task.id)}>
          <SkipForwardIcon />
        </IconButton>
      )}

      <IconButton label="Edit task" onClick={() => edit(task.id)}>
        <PencilIcon />
      </IconButton>
    </div>
  );
}
