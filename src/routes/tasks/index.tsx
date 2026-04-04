import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { format, parseISO } from 'date-fns';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { createCalendarDay } from '@/domain/calendar/calendarDay';
import type { TaskResolutionType } from '@/domain/task/taskResolutionTypes';
import { DayNavigator } from '@/features/calendar/DayNavigator';
import { QuickAddTask } from '@/features/tasks/components/QuickAddTask';
import { TaskList } from '@/features/tasks/components/TaskList';
import { Route as TasksEditRoute } from '@/routes/tasks/$taskId';
import { Route as TasksCreateRoute } from '@/routes/tasks/create';
import { deleteTask as deleteTaskMutation } from '@/server/tasks/deleteTask';
import { getTasksForDate } from '@/server/tasks/getTasksForDate';
import { resolveTask } from '@/server/tasks/resolveTask';
import { undoTaskResolution } from '@/server/tasks/undoTaskResolution';
import type { ResolveTaskResult } from '@/shared/types/task';

const DELETE_TOAST_DURATION_MS = 5000;

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
  const deleteTaskFn = useServerFn(deleteTaskMutation);
  const { tasks, targetDate } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const deleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    new Set(),
  );

  if (!targetDate) {
    return <DayNavigator />;
  }

  const day = createCalendarDay(targetDate);

  const visibleTasks = tasks.filter((task) => !pendingDeleteIds.has(task.id));
  const activeTasks = visibleTasks.filter((task) => task.status === 'active');
  const upcomingTasks = visibleTasks.filter(
    (task) => task.status === 'upcoming',
  );

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
                onClick: () => editTask(nextTask.id),
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

  function editTask(id: string) {
    navigate({ to: TasksEditRoute.to, params: { taskId: id } });
  }

  function undoDelete(id: string) {
    const timer = deleteTimersRef.current.get(id);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    deleteTimersRef.current.delete(id);
    setPendingDeleteIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  async function commitDelete(id: string) {
    try {
      await deleteTaskFn({ data: id });
    } catch {
      toast.error('Failed to delete task');
    } finally {
      deleteTimersRef.current.delete(id);
      setPendingDeleteIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      void router.invalidate();
    }
  }

  function deleteTask(id: string) {
    if (deleteTimersRef.current.has(id)) {
      return;
    }

    setPendingDeleteIds((current) => new Set(current).add(id));

    const timer = setTimeout(() => {
      void commitDelete(id);
    }, DELETE_TOAST_DURATION_MS);

    deleteTimersRef.current.set(id, timer);

    toast('Task deleted', {
      duration: DELETE_TOAST_DURATION_MS,
      action: {
        label: 'Undo',
        onClick: () => undoDelete(id),
      },
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-12 flex flex-col gap-6">
      <header className="flex flex-col items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
        <DayNavigator day={day} />
      </header>

      <QuickAddTask
        onCreated={() => {
          void navigate({ search: { date: format(new Date(), 'yyyy-MM-dd') } });
        }}
        onOpenFullForm={(name) =>
          navigate({
            to: TasksCreateRoute.to,
            search: {
              name: name || undefined,
              returnTo: location.pathname + location.search,
            },
          })
        }
      />

      <TaskList
        title="Active Tasks"
        emptyMessage="No active tasks"
        tasks={activeTasks}
        actions={{
          completeTask: (id) => resolve(id, 'completed'),
          skipTask: (id) => resolve(id, 'skipped'),
          editTask,
          deleteTask,
        }}
      />

      <TaskList
        title="Upcoming Tasks"
        emptyMessage="No upcoming tasks"
        tasks={upcomingTasks}
        actions={{ editTask, deleteTask }}
      />
    </div>
  );
}
