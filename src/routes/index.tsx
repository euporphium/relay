import { createFileRoute } from '@tanstack/react-router';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { useEffect } from 'react';
import { z } from 'zod';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { getTasksForDate } from '@/server/tasks/getTasks';

export const Route = createFileRoute('/')({
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
  component: App,
});

function App() {
  const { tasks, targetDate } = Route.useLoaderData();
  const navigate = Route.useNavigate();

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

  return (
    <div className="p-4">
      <ThemeToggle />
      <div className="flex items-center justify-between mb-4">
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

      <CreateTaskForm />

      {activeTasks.length > 0 && (
        <section className="mt-12 border p-4 rounded">
          <h2 className="text-2xl mb-4">Active Tasks</h2>
          <ul className="space-y-2">
            {activeTasks.map((task) => (
              <li key={task.id} className="grid grid-cols-4 gap-4 items-center">
                <span className="font-medium">{task.name}</span>
                <span className="text-sm text-muted-foreground col-span-2">
                  {task.note}
                </span>
                <span className="text-sm">{task.scheduledDate}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcomingTasks.length > 0 && (
        <section className="mt-12 border p-4 rounded">
          <h2 className="text-2xl mb-4">Upcoming Tasks</h2>
          <ul className="space-y-2">
            {upcomingTasks.map((task) => (
              <li key={task.id} className="grid grid-cols-4 gap-4 items-center">
                <span className="font-medium">{task.name}</span>
                <span className="text-sm text-muted-foreground col-span-2">
                  {task.note}
                </span>
                <span className="text-sm">{task.scheduledDate}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
