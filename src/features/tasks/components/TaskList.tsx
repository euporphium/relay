import { CaretDownIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { TaskForDate } from '@/shared/types/task';
import { type TaskActions, TaskRow } from './TaskRow';

type TaskListProps = {
  title: string;
  emptyMessage: string;
  tasks: TaskForDate[];
  actions: TaskActions;
  defaultOpen?: boolean;
};

export function TaskList({
  title,
  emptyMessage,
  tasks,
  actions,
  defaultOpen = true,
}: TaskListProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card size="sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
                {tasks.length > 0 && (
                  <Badge variant="secondary">{tasks.length}</Badge>
                )}
              </div>
              <CaretDownIcon
                size={16}
                className={cn(
                  'text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              tasks.map((task) => (
                <TaskRow key={task.id} task={task} actions={actions} />
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
