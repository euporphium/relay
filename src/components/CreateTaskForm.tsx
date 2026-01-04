import type z from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { taskInputSchema, taskSchema } from '@/schemas/task';
import { createTask } from '@/server/tasks/createTask';

const defaultValues: z.input<typeof taskInputSchema> = {
  name: '',
  note: '',
  scheduledDate: new Date(),
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

        <Button>Create</Button>
      </FieldGroup>
    </form>
  );
}
