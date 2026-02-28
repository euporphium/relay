import { CheckCircleIcon, DotsThreeVerticalIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePointerType } from '@/hooks/usePointerType';
import { useSwipeToComplete } from '@/hooks/useSwipeToComplete';
import { cn } from '@/lib/utils';
import type { TaskForDate } from '@/shared/types/task';
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
  const { pointerType } = usePointerType();

  const completeTaskAction =
    task.status === 'active' ? completeTask : undefined;
  const canComplete = Boolean(completeTaskAction);
  const canSkip = task.status === 'active' && skipTask;
  const canSwipeToComplete = pointerType === 'coarse' && canComplete;
  const swipe = useSwipeToComplete({
    enabled: canSwipeToComplete,
    onComplete: () => completeTaskAction?.(task.id),
  });
  const isHorizontalPreview =
    canSwipeToComplete &&
    swipe.axisLock === 'horizontal' &&
    swipe.isInteracting &&
    swipe.horizontalOffset > 0;
  const previewBackgroundClass = isHorizontalPreview
    ? swipe.isCommitPreview
      ? 'bg-success/20'
      : 'bg-success/10'
    : 'bg-transparent';
  const checkPreviewClass = swipe.isCommitPreview
    ? 'text-success opacity-100 dark:text-success'
    : 'text-success/80 opacity-70 dark:text-success/80';
  const swipeContainerProps = canSwipeToComplete
    ? {
        style: {
          transform: `translate3d(${swipe.horizontalOffset}px, 0, 0)`,
          transition: swipe.transitionOverride,
          touchAction: swipe.axisLock === 'horizontal' ? 'none' : 'pan-y',
        },
        ...swipe.pointerHandlers,
      }
    : undefined;

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="More actions"
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => editTask(task.id)}>
          Edit
        </DropdownMenuItem>
        {canComplete ? (
          <DropdownMenuItem onClick={() => completeTaskAction?.(task.id)}>
            Complete
          </DropdownMenuItem>
        ) : null}
        {canSkip ? (
          <DropdownMenuItem onClick={() => skipTask(task.id)}>
            Skip
          </DropdownMenuItem>
        ) : null}
        {canComplete || canSkip ? <DropdownMenuSeparator /> : null}
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
    <div className="relative overflow-hidden rounded-lg">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-lg transition-colors duration-150',
          previewBackgroundClass,
        )}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 z-0 flex items-center"
      >
        {isHorizontalPreview ? (
          <CheckCircleIcon
            size={18}
            weight="bold"
            className={cn('transition-opacity duration-100', checkPreviewClass)}
          />
        ) : null}
      </div>

      <div
        className={cn(
          'relative z-10 flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors md:gap-6',
          pointerType === 'fine' && 'hover:bg-muted/40',
        )}
        {...swipeContainerProps}
      >
        <TaskContent task={task} actions={actionsMenu} />
      </div>
    </div>
  );
}
