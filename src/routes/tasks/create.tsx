import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { TaskFormBody } from '@/components/task/TaskFormBody';
import {
  type TaskFormValues,
  taskFormSchema,
} from '@/components/task/taskForm.schema';
import { createTask } from '@/server/tasks/createTask';

export const Route = createFileRoute('/tasks/create')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();

  const defaultValues: TaskFormValues = {
    name: '',
    note: '',
    scheduledDate: new Date(),
    preview: undefined,
    reschedule: undefined,
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: taskFormSchema },
    onSubmit: async ({ value }) => {
      await createTask({ data: value });
      form.reset();
      navigate({ to: returnTo ?? '/tasks' });
    },
  });

  return (
    <div className="p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await form.handleSubmit();
        }}
      >
        <TaskFormBody form={form} submitLabel="Create" />
      </form>
    </div>
  );
}
