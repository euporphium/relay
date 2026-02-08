import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { TaskForm } from '@/features/tasks/forms/TaskForm';
import { createTask } from '@/server/tasks/createTask';
import {
  type TaskInput,
  taskInputSchema,
} from '@/shared/validation/taskInput.schema';

export const Route = createFileRoute('/tasks/create')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();

  const defaultValues: TaskInput = {
    name: '',
    note: '',
    scheduledDate: new Date(),
    preview: undefined,
    reschedule: undefined,
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: taskInputSchema },
    onSubmit: async ({ value }) => {
      await createTask({ data: value });
      form.reset();
      void navigate({ to: returnTo ?? '/tasks' });
    },
  });

  return <TaskForm form={form} submitLabel="Create" />;
}
