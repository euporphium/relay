import { CheckIcon, DotsThreeVerticalIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TaskForDate } from '@/shared/types/task';
import { IconButton } from './IconButton';
import { TaskContent } from './TaskContent';

export type TaskActions = {
  completeTask?: (taskId: string) => void;
  skipTask?: (taskId: string) => void;
  editTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
};

type TaskRowProps = {
  task: TaskForDate;
  actions: TaskActions;
};

export function TaskRow({ task, actions }: TaskRowProps) {
  const { completeTask, skipTask, editTask, deleteTask } = actions;

  const canComplete = task.status === 'active' && completeTask;
  const canSkip = task.status === 'active' && skipTask;
  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="More actions"
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => editTask(task.id)}>
          Edit
        </DropdownMenuItem>
        {canSkip ? (
          <DropdownMenuItem onClick={() => skipTask(task.id)}>
            Skip
          </DropdownMenuItem>
        ) : null}
        {canSkip ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => deleteTask(task.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div
      className={cn(
        'flex items-start gap-4 md:gap-6 rounded-lg border p-4',
        'hover:bg-muted/40 transition-colors',
      )}
    >
      {canComplete && (
        <IconButton
          label="Complete task"
          onClick={() => completeTask(task.id)}
          className="self-center"
        >
          <CheckIcon />
        </IconButton>
      )}

      <TaskContent task={task} actions={actionsMenu} />
    </div>
  );
}
