import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaskForDate } from '@/server/tasks/getTasksForDate';

type TaskRowProps = {
  task: TaskForDate;
  onComplete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
};

export function TaskRow({ task, onComplete, onEdit }: TaskRowProps) {
  const isCompletable = task.status === 'active';

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4',
        'hover:bg-muted/40 transition-colors',
      )}
    >
      {isCompletable && (
        <CompletionButton onClick={() => onComplete?.(task.id)} />
      )}

      {/* Task content */}
      <div className="flex-1 space-y-1">
        <p className="leading-none">{task.name}</p>

        {task.note && (
          <p className="text-sm text-muted-foreground">{task.note}</p>
        )}

        {task.scheduledDate && (
          <p className="text-xs text-muted-foreground">
            {format(parseISO(task.scheduledDate), 'EEE, MMM d')}
          </p>
        )}
      </div>

      {/* Actions */}
      <EditButton onClick={() => onEdit?.(task.id)} />
    </div>
  );
}

import { Card } from '@/components/ui/card';

type ActiveTasksProps = {
  tasks: TaskForDate[];
  onComplete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
};

export function ActiveTasks({ tasks, onComplete, onEdit }: ActiveTasksProps) {
  const activeTasks = tasks.filter((task) => task.status === 'active');

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Active Tasks</h2>

      <div className="space-y-2">
        {activeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active tasks</p>
        ) : (
          activeTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={onComplete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </Card>
  );
}

type UpcomingTasksProps = {
  tasks: TaskForDate[];
  onEdit?: (taskId: string) => void;
};

export function UpcomingTasks({ tasks, onEdit }: UpcomingTasksProps) {
  const upcomingTasks = tasks.filter((task) => task.status === 'upcoming');

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Upcoming Tasks</h2>

      <div className="space-y-2">
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming tasks</p>
        ) : (
          upcomingTasks.map((task) => (
            <TaskRow key={task.id} task={task} onEdit={onEdit} />
          ))
        )}
      </div>
    </Card>
  );
}

import { CheckIcon, PencilIcon } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';

type CompletionButtonProps = {
  onClick: () => void;
};

export function CompletionButton({ onClick }: CompletionButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={onClick}
      aria-label="Complete task"
    >
      <CheckIcon />
    </Button>
  );
}

type EditButtonProps = {
  onClick: () => void;
};

export function EditButton({ onClick }: EditButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={onClick}
      aria-label="Edit task"
    >
      <PencilIcon />
    </Button>
  );
}
