import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { PriorityForm } from '@/features/priorities/forms/PriorityForm';
import { createPriority } from '@/server/priorities/createPriority';
import { getPriorityGroups } from '@/server/priorities/getPriorityGroups';
import {
  type PriorityInput,
  priorityInputSchema,
} from '@/shared/validation/priorityInput.schema';

export const Route = createFileRoute('/priorities/create')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  loader: async () => getPriorityGroups(),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();
  const { groups } = Route.useLoaderData();

  const defaultValues: PriorityInput = {
    title: '',
    note: '',
    groupId: undefined,
    groupName: '',
    groupSelection: undefined,
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: priorityInputSchema },
    onSubmit: async ({ value }) => {
      await createPriority({ data: value });
      form.reset();
      void navigate({ to: returnTo ?? '/priorities' });
    },
  });

  return <PriorityForm form={form} groups={groups} submitLabel="Create" />;
}
