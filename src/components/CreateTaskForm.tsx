import type * as z from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { OptionalField } from '@/components/form/OptionalField';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSeparator } from '@/components/ui/field';
import { getFieldValidator } from '@/lib/utils';
import { taskInputSchema, taskSchema } from '@/schemas/task';
import { createTask } from '@/server/tasks/createTask';

const defaultValues: z.input<typeof taskInputSchema> = {
  name: '',
  note: '',
  scheduledDate: new Date(),
  preview: undefined,
};

export function CreateTaskForm() {
  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: taskInputSchema,
    },
    onSubmit: async ({ value }) => {
      const inputResult = taskInputSchema.safeParse(value);

      if (!inputResult.success) {
        console.error(inputResult.error);
        return;
      }

      const persistedResult = taskSchema.safeParse({
        id: crypto.randomUUID(),
        ...inputResult.data,
        createdAt: new Date().toISOString(),
      });

      if (!persistedResult.success) {
        console.error(persistedResult.error);
        return;
      }

      await createTask({ data: persistedResult.data });

      form.reset();
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
            onSubmit: getFieldValidator(taskInputSchema, 'preview'),
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
