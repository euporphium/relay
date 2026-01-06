import { createFileRoute, notFound } from '@tanstack/react-router';
import { parseISO } from 'date-fns';
import { useAppForm } from '@/components/form/hooks';
import { OptionalField } from '@/components/form/OptionalField';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSeparator } from '@/components/ui/field';
import { getFieldValidator } from '@/lib/utils';
import { type Task, type TaskFormValues, taskFormSchema } from '@/schemas/task';
import { getTask } from '@/server/tasks/getTask';
import { updateTask } from '@/server/tasks/updateTask';

export const Route = createFileRoute('/tasks/$taskId')({
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
      <p>The task you’re looking for doesn’t exist.</p>
    </div>
  ),
});

function RouteComponent() {
  const { task } = Route.useLoaderData();

  const form = useAppForm({
    defaultValues: taskToFormDefaults(task),
    validators: { onSubmit: taskFormSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateTask({
          data: { id: task.id, updates: value },
        });
      } catch (e) {
        console.error('Error updating task:', e); // TODO (rare)
      }

      // onSuccess?.();
    },
  });

  return (
    <div className="p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await form.handleSubmit();
        }}
        autoComplete="off"
      >
        <FieldGroup>
          <form.AppField name="name">
            {(field) => <field.Input label="Name" />}
          </form.AppField>

          <form.AppField name="note">
            {(field) => (
              <field.Textarea
                label="Note"
                description="Optional additional context"
              />
            )}
          </form.AppField>

          <form.AppField name="scheduledDate">
            {(field) => <field.DatePicker label="Scheduled date" />}
          </form.AppField>

          <FieldSeparator />

          <form.AppField
            name="preview"
            // Nested object fields need explicit validators to populate field.state.meta.errors
            validators={{
              onSubmit: getFieldValidator(taskFormSchema, 'preview'),
            }}
          >
            {(field) => (
              <OptionalField
                label="Enable preview"
                description="Show the task ahead of its scheduled date"
                value={field.state.value}
                defaultValue={{ value: '1', unit: 'day' }}
                onChange={field.handleChange}
              >
                <field.CalendarInterval label="How far in advance" />
              </OptionalField>
            )}
          </form.AppField>

          <FieldSeparator />

          <Button>Save</Button>
        </FieldGroup>
      </form>
    </div>
  );
}

function taskToFormDefaults(task: Task): TaskFormValues {
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
  };
}
