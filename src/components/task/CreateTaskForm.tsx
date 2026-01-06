import { useAppForm } from '@/components/form/hooks';
import { OptionalField } from '@/components/form/OptionalField';
import {
  type TaskFormValues,
  taskFormSchema,
} from '@/components/task/taskForm.schema';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSeparator } from '@/components/ui/field';
import { getFieldValidator } from '@/lib/utils';
import { createTask } from '@/server/tasks/createTask';

const defaultValues: TaskFormValues = {
  name: '',
  note: '',
  scheduledDate: new Date(),
  preview: undefined,
};

type CreateTaskFormProps = {
  onSuccess?: () => void;
};

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: taskFormSchema },
    onSubmit: async ({ value }) => {
      await createTask({ data: value });

      form.reset();
      onSuccess?.();
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await form.handleSubmit();
      }}
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

        <Button>Create</Button>
      </FieldGroup>
    </form>
  );
}
