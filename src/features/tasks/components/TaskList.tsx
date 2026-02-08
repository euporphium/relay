import { Card } from '@/components/ui/card';
import type { TaskForDate } from '@/shared/types/task';
import { type TaskActions, TaskRow } from './TaskRow';

type TaskListProps = {
  title: string;
  emptyMessage: string;
  tasks: TaskForDate[];
  actions: TaskActions;
};

export function TaskList({
  title,
  emptyMessage,
  tasks,
  actions,
}: TaskListProps) {
  return (
    <Card className="space-y-4 p-6 md:p-8">
      <h2 className="text-lg md:text-xl font-semibold">{title}</h2>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          tasks.map((task) => (
            <TaskRow key={task.id} task={task} actions={actions} />
          ))
        )}
      </div>
    </Card>
  );
}
