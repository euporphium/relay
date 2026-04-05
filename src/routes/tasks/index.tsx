import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { format, parseISO } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { createCalendarDay } from '@/domain/calendar/calendarDay';
import type { TaskResolutionType } from '@/domain/task/taskResolutionTypes';
import { DayNavigator } from '@/features/calendar/DayNavigator';
import { CompletedTaskList } from '@/features/tasks/components/CompletedTaskList';
import { QuickAddTask } from '@/features/tasks/components/QuickAddTask';
import { TaskList } from '@/features/tasks/components/TaskList';
import { Route as TasksEditRoute } from '@/routes/tasks/$taskId';
import { Route as TasksCreateRoute } from '@/routes/tasks/create';
import { deleteTask as deleteTaskMutation } from '@/server/tasks/deleteTask';
import { getResolvedTasksForDate } from '@/server/tasks/getResolvedTasksForDate';
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
        resolvedTasks: [],
        targetDate: undefined,
      };
    }

    const [tasks, resolvedTasks] = await Promise.all([
      getTasksForDate({ data: date }),
      getResolvedTasksForDate({ data: date }),
    ]);
    return { tasks, resolvedTasks, targetDate: date };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const resolveTaskFn = useServerFn(resolveTask);
  const undoTaskResolutionFn = useServerFn(undoTaskResolution);
  const deleteTaskFn = useServerFn(deleteTaskMutation);
  const { tasks, resolvedTasks, targetDate } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const deleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    // Canonicalize the route on the client using the user's local "today".
    // This avoids server-side timezone assumptions and keeps the URL explicit.
    if (!targetDate) {
      void navigate({
        search: { date: format(new Date(), 'yyyy-MM-dd') },
        replace: true,
      });
    }
  }, [targetDate, navigate]);

  if (!targetDate) {
    return <TaskPageSkeleton />;
  }

  const day = createCalendarDay(targetDate);
  const today = format(new Date(), 'yyyy-MM-dd');
  const isPastDate = targetDate < today;

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

  async function undoResolution(taskId: string, resolutionId: string) {
    try {
      await undoTaskResolutionFn({ data: { taskId, resolutionId } });
      void router.invalidate();
    } catch {
      toast.error('Failed to undo');
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

      {!isPastDate && (
        <>
          <QuickAddTask
            onCreated={() => {
              void navigate({
                search: { date: format(new Date(), 'yyyy-MM-dd') },
              });
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
        </>
      )}

      <CompletedTaskList
        tasks={resolvedTasks}
        actions={{ undoResolution, deleteTask }}
      />
    </div>
  );
}

function TaskPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-12 flex flex-col gap-6 animate-pulse">
      <header className="flex flex-col items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-muted" />
          <div className="h-7 w-40 rounded-md bg-muted" />
          <div className="h-8 w-8 rounded-md bg-muted" />
        </div>
      </header>

      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 w-9 rounded-md bg-muted" />
        <div className="h-9 w-9 rounded-md bg-muted" />
      </div>

      <SkeletonTaskCard rows={3} />
      <SkeletonTaskCard rows={2} />
    </div>
  );
}

function SkeletonTaskCard({ rows }: { rows: number }) {
  return (
    <div className="ring-foreground/10 bg-card rounded-2xl py-4 ring-1 flex flex-col gap-4">
      <div className="px-4 flex items-center justify-between">
        <div className="h-6 w-32 rounded-md bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
      </div>
      <div className="px-4 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
