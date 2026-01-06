import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { CreateTaskForm } from '@/components/task/CreateTaskForm';

export const Route = createFileRoute('/tasks/create')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();

  return (
    <div className="p-4">
      <CreateTaskForm
        onSuccess={() => {
          navigate({ to: returnTo ?? '/tasks' });
        }}
      />
    </div>
  );
}
