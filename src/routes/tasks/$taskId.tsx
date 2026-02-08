import { createFileRoute, notFound } from '@tanstack/react-router';
import { parseISO } from 'date-fns';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { TaskForm } from '@/features/tasks/forms/TaskForm';
import { getTask } from '@/server/tasks/getTask';
import { updateTask } from '@/server/tasks/updateTask';
import type { Task } from '@/shared/types/task';
import {
  type TaskInput,
  taskInputSchema,
} from '@/shared/validation/taskInput.schema';

export const Route = createFileRoute('/tasks/$taskId')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  loader: async ({ params }) => {
    const task = await getTask({ data: params.taskId });

    if (!task) {
      throw notFound();
    }

    return { task };
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <div>
      <h1>Task not found</h1>
      <p>The task you're looking for doesn't exist.</p>
    </div>
  ),
});

function RouteComponent() {
  const { task } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();

  const form = useAppForm({
    defaultValues: taskToFormDefaults(task),
    validators: { onSubmit: taskInputSchema },
    onSubmit: async ({ value }) => {
      await updateTask({
        data: { id: task.id, updates: value },
      });

      void navigate({ to: returnTo ?? '/tasks' });
    },
  });

  return <TaskForm form={form} submitLabel="Save" />;
}

function taskToFormDefaults(task: Task): TaskInput {
  if (!task) {
    throw Error('Task is required to populate form defaults');
  }

  return {
    name: task.name,
    note: task.note ?? undefined,
    scheduledDate: parseISO(task.scheduledDate),
    preview:
      task.previewLeadTime != null && task.previewUnit != null
        ? {
            value: String(task.previewLeadTime),
            unit: task.previewUnit,
          }
        : undefined,
    reschedule:
      task.rescheduleEvery != null &&
      task.rescheduleUnit != null &&
      task.rescheduleFrom != null
        ? {
            value: String(task.rescheduleEvery),
            unit: task.rescheduleUnit,
            from: task.rescheduleFrom,
          }
        : undefined,
  };
}
