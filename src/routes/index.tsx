// import { isNull, lte, not, useLiveQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { addDays, format, subDays } from 'date-fns';
import { useState } from 'react';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
// import { taskCollection } from '@/lib/collections';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // const { data: activeTasks } = useLiveQuery(
  //   (q) =>
  //     q
  //       .from({ task: taskCollection })
  //       .where(({ task }) =>
  //         lte(task.date, format(currentDate, 'yyyy-MM-dd')),
  //       )
  //       .where(({ task }) => isNull(task.completedAt))
  //       .orderBy(({ task }) => task.date),
  //   [currentDate],
  // );
  //
  // const { data: completedTasks } = useLiveQuery(
  //   (q) =>
  //     q
  //       .from({ task: taskCollection })
  //       .where(({ task }) => not(isNull(task.completedAt)))
  //       .orderBy(({ task }) => task.date),
  //   // limit
  //   [currentDate],
  // );

  // function completeTask(id: string) {
  //   taskCollection.update(id, (task) => {
  //     task.completedAt = new Date().toISOString();
  //   });
  // }

  return (
    <div className="p-4">
      <ThemeToggle />
      <div className="flex items-center justify-between mb-4">
        <Button onClick={() => setCurrentDate((d) => subDays(d, 1))}>
          &lt;
        </Button>
        {format(currentDate, 'yyyy-MM-dd')}
        <Button onClick={() => setCurrentDate((d) => addDays(d, 1))}>
          &gt;
        </Button>
      </div>

      <CreateTaskForm />

      {/*{activeTasks.length > 0 && (*/}
      {/*  <section className="mt-12 border p-4 rounded">*/}
      {/*    <h2 className="text-2xl mb-4">Active Tasks</h2>*/}
      {/*    <ul>*/}
      {/*      {activeTasks.map((task) => (*/}
      {/*        <li key={task.id} className="grid grid-cols-4 gap-4">*/}
      {/*          <span>{task.name}</span>*/}
      {/*          <span>{task.description}</span>*/}
      {/*          <span>Active since {task.date}</span>*/}
      {/*          <Button onClick={() => completeTask(task.id)}>*/}
      {/*            Complete*/}
      {/*          </Button>*/}
      {/*        </li>*/}
      {/*      ))}*/}
      {/*    </ul>*/}
      {/*  </section>*/}
      {/*)}*/}

      {/*{completedTasks.length > 0 && (*/}
      {/*  <section className="mt-12 border p-4 rounded">*/}
      {/*    <h2 className="text-2xl mb-4">Completed Tasks</h2>*/}
      {/*    <ul>*/}
      {/*      {completedTasks.map((task) => (*/}
      {/*        <li key={task.id} className="grid grid-cols-4 gap-4">*/}
      {/*          <span>{task.name}</span>*/}
      {/*          <span>{task.description}</span>*/}
      {/*          <span>Completed on {task.completedAt}</span>*/}
      {/*        </li>*/}
      {/*      ))}*/}
      {/*    </ul>*/}
      {/*  </section>*/}
      {/*)}*/}
    </div>
  );
}
