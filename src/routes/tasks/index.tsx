import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { createCalendarDay } from '@/domain/calendar/calendarDay';
import type { TaskResolutionType } from '@/domain/task/taskResolutionTypes';
import { DayNavigator } from '@/features/calendar/DayNavigator';
import { TaskList } from '@/features/tasks/components/TaskList';
import { Route as TasksEditRoute } from '@/routes/tasks/$taskId';
import { Route as TasksCreateRoute } from '@/routes/tasks/create';
import { getTasksForDate } from '@/server/tasks/getTasksForDate';
import {
  type ResolveTaskResult,
  resolveTask,
} from '@/server/tasks/resolveTask';
import { undoTaskResolution } from '@/server/tasks/undoTaskResolution';

export const Route = createFileRoute('/tasks/')({
  validateSearch: z.object({
    date: z.iso.date().optional(),
  }),
  // The loader depends on the `date` search param but does not invent one.
  // "Today" is intentionally NOT computed on the server, since server time
  // may differ from the user's local day.
  loaderDeps: ({ search: { date } }) => ({ date }),
  loader: async ({ deps: { date } }) => {
    // If no date is present yet, return an empty state.
    // The client will canonicalize the URL with a user-local date.
    if (!date) {
      return {
        tasks: [],
        targetDate: undefined,
      };
    }

    const tasks = await getTasksForDate({ data: date });
    return { tasks, targetDate: date };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const resolveTaskFn = useServerFn(resolveTask);
  const undoTaskResolutionFn = useServerFn(undoTaskResolution);
  const { tasks, targetDate } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();

  if (!targetDate) {
    return <DayNavigator />;
  }

  const day = createCalendarDay(targetDate);

  const activeTasks = tasks.filter((task) => task.status === 'active');
  const upcomingTasks = tasks.filter((task) => task.status === 'upcoming');

  async function resolve(id: string, resolutionType: TaskResolutionType) {
    const label = resolutionType === 'completed' ? 'completed' : 'skipped';

    try {
      const result = await resolveTaskFn({
        data: { id, resolutionType, resolvedDate: day.iso },
      });

      void router.invalidate();

      const { nextTask } = result;
      const nextTaskDate = nextTask
        ? format(parseISO(nextTask.scheduledDate), 'MMM d')
        : null;

      toast(
        nextTaskDate ? `Task ${label}. Next: ${nextTaskDate}` : `Task ${label}`,
        {
          action: {
            label: 'Undo',
            onClick: () => handleUndo(result, id),
          },
          cancel: nextTask
            ? {
                label: 'Edit',
                onClick: () => edit(nextTask.id),
              }
            : undefined,
        },
      );
    } catch {
      toast.error(
        `Failed to ${resolutionType === 'completed' ? 'complete' : 'skip'} task`,
      );
    }
  }

  async function handleUndo(result: ResolveTaskResult, taskId: string) {
    try {
      await undoTaskResolutionFn({
        data: {
          taskId,
          resolutionId: result.resolutionId,
          nextTaskId: result.nextTask?.id,
        },
      });
      void router.invalidate();
    } catch {
      toast.error('Failed to undo');
    }
  }

  function edit(id: string) {
    navigate({ to: TasksEditRoute.to, params: { taskId: id } });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-12 flex flex-col gap-6">
      <header className="flex flex-col items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
        <DayNavigator day={day} />
      </header>

      <Button
        onClick={() =>
          navigate({
            to: TasksCreateRoute.to,
            search: { returnTo: location.pathname + location.search },
          })
        }
      >
        Create New Task
      </Button>

      <TaskList
        title="Active Tasks"
        emptyMessage="No active tasks"
        tasks={activeTasks}
        actions={{
          complete: (id) => resolve(id, 'completed'),
          skip: (id) => resolve(id, 'skipped'),
          edit,
        }}
      />

      <TaskList
        title="Upcoming Tasks"
        emptyMessage="No upcoming tasks"
        tasks={upcomingTasks}
        actions={{ edit }}
      />
    </div>
  );
}
