import { createFileRoute, useRouter } from '@tanstack/react-router';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { useEffect } from 'react';
import { z } from 'zod';
import { ActiveTasks, UpcomingTasks } from '@/components/TaskRow';
import { Button } from '@/components/ui/button';
import { Route as TasksEditRoute } from '@/routes/tasks/$taskId';
import { Route as TasksCreateRoute } from '@/routes/tasks/create';
import { completeTask } from '@/server/tasks/completeTask';
import { getTasksForDate } from '@/server/tasks/getTasksForDate';

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

  useEffect(() => {
    // Canonicalize the route on the client using the user's local "today".
    // This avoids server-side timezone assumptions and keeps the URL explicit.
    if (!targetDate) {
      navigate({
        search: {
          date: format(new Date(), 'yyyy-MM-dd'),
        },
        replace: true,
      });
    }
  }, [targetDate, navigate]);

  // Prevent rendering until the canonical date is established
  // TODO This could be replaced with a loading or skeleton state later.
  if (!targetDate) {
    return null;
  }

  const activeTasks = tasks.filter((task) => task.status === 'active');
  const upcomingTasks = tasks.filter((task) => task.status === 'upcoming');

  async function onComplete(id: string) {
    await completeTask({
      data: { id, completedDate: format(new Date(), 'yyyy-MM-dd') },
    });

    router.invalidate();
  }

  function onEdit(id: string) {
    navigate({ to: TasksEditRoute.to, params: { taskId: id } });
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          onClick={() =>
            navigate({
              search: {
                date: format(subDays(parseISO(targetDate), 1), 'yyyy-MM-dd'),
              },
            })
          }
        >
          &lt;
        </Button>
        {targetDate}
        <Button
          onClick={() =>
            navigate({
              search: {
                date: format(addDays(parseISO(targetDate), 1), 'yyyy-MM-dd'),
              },
            })
          }
        >
          &gt;
        </Button>
      </div>

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
