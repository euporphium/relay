import { isNull, lte, not, useLiveQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { addDays, format, subDays } from 'date-fns';
import { useState } from 'react';
import { CreateRoutineForm } from '@/components/CreateRoutineForm';
import { Button } from '@/components/ui/button';
import { routineCollection } from '@/lib/collections';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: activeRoutines } = useLiveQuery(
    (q) =>
      q
        .from({ routine: routineCollection })
        .where(({ routine }) =>
          lte(routine.date, format(currentDate, 'yyyy-MM-dd')),
        )
        .where(({ routine }) => isNull(routine.completedAt))
        .orderBy(({ routine }) => routine.date),
    [currentDate],
  );

  const { data: completedRoutines } = useLiveQuery(
    (q) =>
      q
        .from({ routine: routineCollection })
        .where(({ routine }) => not(isNull(routine.completedAt)))
        .orderBy(({ routine }) => routine.date),
    // limit
    [currentDate],
  );

  function completeRoutine(id: string) {
    routineCollection.update(id, (routine) => {
      routine.completedAt = new Date().toISOString();
    });
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Button onClick={() => setCurrentDate((d) => subDays(d, 1))}>
          &lt;
        </Button>
        {format(currentDate, 'yyyy-MM-dd')}
        <Button onClick={() => setCurrentDate((d) => addDays(d, 1))}>
          &gt;
        </Button>
      </div>

      <CreateRoutineForm />

      {activeRoutines.length > 0 && (
        <section className="mt-12 border p-4 rounded">
          <h2 className="text-2xl mb-4">Active Routines</h2>
          <ul>
            {activeRoutines.map((routine) => (
              <li key={routine.id} className="grid grid-cols-4 gap-4">
                <span>{routine.name}</span>
                <span>{routine.description}</span>
                <span>Active since {routine.date}</span>
                <Button onClick={() => completeRoutine(routine.id)}>
                  Complete
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {completedRoutines.length > 0 && (
        <section className="mt-12 border p-4 rounded">
          <h2 className="text-2xl mb-4">Completed Routines</h2>
          <ul>
            {completedRoutines.map((routine) => (
              <li key={routine.id} className="grid grid-cols-4 gap-4">
                <span>{routine.name}</span>
                <span>{routine.description}</span>
                <span>Completed on {routine.completedAt}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
