import { createFileRoute } from '@tanstack/react-router';
import type z from 'zod';
import { useAppForm } from '@/components/form/hooks.tsx';
import { Button } from '@/components/ui/button.tsx';
import { FieldGroup } from '@/components/ui/field.tsx';
import { routineSchema } from '@/schemas/routine.ts';

export const Route = createFileRoute('/')({
  component: App,
});

type FormData = z.infer<typeof routineSchema>;

function App() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      description: '',
    } satisfies FormData,
    validators: {
      onSubmit: routineSchema,
    },
    onSubmit: async ({ value }) => {
      console.log('Form submitted with values:', value);
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

          <Button>Create</Button>
        </FieldGroup>
      </form>
    </div>
  );
}
