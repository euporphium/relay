import { createFileRoute } from '@tanstack/react-router';
import type z from 'zod';
import { useAppForm } from '@/components/form/hooks.tsx';
import { Button } from '@/components/ui/button.tsx';
import { FieldGroup } from '@/components/ui/field.tsx';
import { routineSchema } from '@/schemas/routine.ts';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const defaultValues: z.input<typeof routineSchema> = {
    name: '',
    description: '',
    date: new Date(),
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: routineSchema,
    },
    onSubmit: ({ value }) => {
      const result = routineSchema.safeParse(value);

      if (!result.success) {
        // This should never happen if the form is wired correctly
        console.error(result.error);
        return;
      }

      const routine = result.data;
      console.log('Form submitted with values:', JSON.stringify(routine));
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
    </div>
  );
}
