import { format, parseISO } from 'date-fns';
import type { TaskForDate } from '@/shared/types/task';

type TaskContentProps = {
  task: TaskForDate;
};

export function TaskContent({ task }: TaskContentProps) {
  return (
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
  );
}
