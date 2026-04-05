import { CaretDownIcon, CheckCircleIcon, DotsThreeVerticalIcon, SkipForwardIcon } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TaskResolutionType } from '@/domain/task/taskResolutionTypes';
import type { ResolvedTask } from '@/shared/types/task';

export type CompletedTaskActions = {
  updateResolutionType: (taskId: string, resolutionId: string, type: TaskResolutionType) => void;
  deleteTask: (taskId: string) => void;
};

type CompletedTaskListProps = {
  tasks: ResolvedTask[];
  actions: CompletedTaskActions;
};

export function CompletedTaskList({ tasks, actions }: CompletedTaskListProps) {
  const [open, setOpen] = useState(false);

  if (tasks.length === 0) {
    return null;
  }

  const completedTasks = tasks.filter((t) => t.resolutionType === 'completed');
  const skippedTasks = tasks.filter((t) => t.resolutionType === 'skipped');
  const sortedTasks = [...completedTasks, ...skippedTasks];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card size="sm">
        <CollapsibleTrigger className="w-full cursor-pointer select-none text-left">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-semibold">Completed</h2>
                {completedTasks.length > 0 && (
                  <Badge variant="secondary">{completedTasks.length}</Badge>
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
            {sortedTasks.map((task) => (
              <CompletedTaskRow key={task.id} task={task} actions={actions} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

type CompletedTaskRowProps = {
  task: ResolvedTask;
  actions: CompletedTaskActions;
};

function CompletedTaskRow({ task, actions }: CompletedTaskRowProps) {
  const { updateResolutionType, deleteTask } = actions;

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
        {task.resolutionType === 'skipped' ? (
          <DropdownMenuItem
            onClick={() => updateResolutionType(task.id, task.resolutionId, 'completed')}
          >
            <CheckCircleIcon />
            Mark as completed
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => updateResolutionType(task.id, task.resolutionId, 'skipped')}
          >
            <SkipForwardIcon />
            Mark as skipped
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
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
    <div className="flex items-start gap-4 rounded-lg border bg-card p-4 opacity-75 md:gap-6">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
          <h3 className="min-w-0 wrap-break-word text-sm font-semibold self-center line-through decoration-muted-foreground/50">
            {task.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant={task.resolutionType === 'completed' ? 'success' : 'outline'}>
              {task.resolutionType === 'completed' ? 'Completed' : 'Skipped'}
            </Badge>
            {actionsMenu}
          </div>
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
      </div>
    </div>
  );
}
