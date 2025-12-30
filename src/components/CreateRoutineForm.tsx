import type z from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { routineCollection } from '@/lib/collections';
import { routineInputSchema, routineSchema } from '@/schemas/routine';

const defaultValues: z.input<typeof routineInputSchema> = {
  name: '',
  description: '',
  date: new Date(),
};

export function CreateRoutineForm() {
  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: routineInputSchema,
    },
    onSubmit: ({ value }) => {
      const inputResult = routineInputSchema.safeParse(value);

      if (!inputResult.success) {
        console.error(inputResult.error);
        return;
      }

      const persistedResult = routineSchema.safeParse({
        id: crypto.randomUUID(),
        ...inputResult.data,
        createdAt: new Date().toISOString(),
      });

      if (!persistedResult.success) {
        console.error(persistedResult.error);
        return;
      }

      routineCollection.insert(persistedResult.data);

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

        <form.AppField name="description">
          {(field) => (
            <field.Textarea
              label="Description"
              description="Be as specific as possible"
            />
          )}
        </form.AppField>

        <form.AppField name="date">
          {(field) => <field.DatePicker label="Date" />}
        </form.AppField>

        <Button>Create</Button>
      </FieldGroup>
    </form>
  );
}
