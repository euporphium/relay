import { createFileRoute, useRouter } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { DayNavigator } from '@/components/DayNavigator';
import { ActiveTasks, UpcomingTasks } from '@/components/TaskRow';
import { Button } from '@/components/ui/button';
import { createCalendarDay } from '@/domain/calendar/calendarDay';
import { Route as TasksEditRoute } from '@/routes/tasks/$taskId';
import { Route as TasksCreateRoute } from '@/routes/tasks/create';
import {
  type CompleteTaskResult,
  completeTask,
} from '@/server/tasks/completeTask';
import { getTasksForDate } from '@/server/tasks/getTasksForDate';
import { undoTaskCompletion } from '@/server/tasks/undoTaskCompletion';

type CompletionAttempt = {
  taskId: string;
  canceled: boolean;
  serverResult?: CompleteTaskResult;
  settled: boolean;
};

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
  const { tasks, targetDate } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const attemptsRef = useRef<Map<string, CompletionAttempt>>(new Map());
  const [optimisticallyCompletedIds, setOptimisticallyCompletedIds] = useState(
    new Set<string>(),
  );

  if (!targetDate) {
    return <DayNavigator />;
  }

  const day = createCalendarDay(targetDate);

  const visibleTasks = tasks.filter(
    (task) => !optimisticallyCompletedIds.has(task.id),
  );
  const activeTasks = visibleTasks.filter((task) => task.status === 'active');
  const upcomingTasks = visibleTasks.filter(
    (task) => task.status === 'upcoming',
  );

  function updateOptimisticCompletion(taskId: string, isCompleted: boolean) {
    setOptimisticallyCompletedIds((current) => {
      const next = new Set(current);
      if (isCompleted) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }

  async function handleUndo(attemptId: string) {
    const attempt = attemptsRef.current.get(attemptId);
    if (!attempt) return;

    attempt.canceled = true;
    updateOptimisticCompletion(attempt.taskId, false);
    toast.dismiss(attemptId);

    if (attempt.settled && attempt.serverResult) {
      await undoTaskCompletion({
        data: {
          taskId: attempt.taskId,
          completionId: attempt.serverResult.completionId,
          nextTaskId: attempt.serverResult.nextTask?.id,
        },
      });
      attemptsRef.current.delete(attemptId);
      router.invalidate();
    }
  }

  function onComplete(id: string) {
    const attemptId = crypto.randomUUID();
    const attempt: CompletionAttempt = {
      taskId: id,
      canceled: false,
      settled: false,
    };

    attemptsRef.current.set(attemptId, attempt);
    updateOptimisticCompletion(id, true);

    toast('Task completed', {
      id: attemptId,
      action: {
        label: 'Undo',
        onClick: () => handleUndo(attemptId),
      },
    });

    completeTask({
      data: { id, completedDate: day.iso },
    })
      .then(async (result) => {
        const currentAttempt = attemptsRef.current.get(attemptId);
        if (!currentAttempt) return;

        currentAttempt.serverResult = result;
        currentAttempt.settled = true;

        if (currentAttempt.canceled) {
          await undoTaskCompletion({
            data: {
              taskId: currentAttempt.taskId,
              completionId: result.completionId,
              nextTaskId: result.nextTask?.id,
            },
          });
          attemptsRef.current.delete(attemptId);
          router.invalidate();
          return;
        }

        const nextTaskDate = result.nextTask
          ? format(parseISO(result.nextTask.scheduledDate), 'MMM d')
          : null;

        const nextTask = result.nextTask;

        toast(
          nextTask ? `Task completed. Next: ${nextTaskDate}` : 'Task completed',
          {
            id: attemptId,
            action: {
              label: 'Undo',
              onClick: () => handleUndo(attemptId),
            },
            cancel: nextTask
              ? {
                  label: 'Edit',
                  onClick: () => onEdit(nextTask.id),
                }
              : undefined,
          },
        );

        router.invalidate();
      })
      .catch(() => {
        const currentAttempt = attemptsRef.current.get(attemptId);
        if (!currentAttempt) return;

        if (!currentAttempt.canceled) {
          updateOptimisticCompletion(currentAttempt.taskId, false);
          toast.error('Failed to complete task', { id: attemptId });
        }

        attemptsRef.current.delete(attemptId);
      });
  }

  function onEdit(id: string) {
    navigate({ to: TasksEditRoute.to, params: { taskId: id } });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-12 flex flex-col gap-6">
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

      <ActiveTasks
        tasks={activeTasks}
        onComplete={onComplete}
        onEdit={onEdit}
      />

      <UpcomingTasks tasks={upcomingTasks} onEdit={onEdit} />
    </div>
  );
}
