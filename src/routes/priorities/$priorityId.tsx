import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { PriorityForm } from '@/features/priorities/forms/PriorityForm';
import { getPriority } from '@/server/priorities/getPriority';
import { getPriorityGroups } from '@/server/priorities/getPriorityGroups';
import { updatePriority } from '@/server/priorities/updatePriority';
import type { PriorityInput } from '@/shared/validation/priorityInput.schema';
import { priorityInputSchema } from '@/shared/validation/priorityInput.schema';

export const Route = createFileRoute('/priorities/$priorityId')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  loader: async ({ params }) => {
    const [priority, { groups }] = await Promise.all([
      getPriority({ data: params.priorityId }),
      getPriorityGroups(),
    ]);

    if (!priority) {
      throw notFound();
    }

    return { priority, groups };
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <div>
      <h1>Priority not found</h1>
      <p>The priority you're looking for doesn't exist.</p>
    </div>
  ),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();
  const { priority, groups } = Route.useLoaderData();

  const form = useAppForm({
    defaultValues: priorityToFormDefaults(priority),
    validators: { onSubmit: priorityInputSchema },
    onSubmit: async ({ value }) => {
      await updatePriority({
        data: { id: priority.id, updates: value },
      });

      void navigate({ to: returnTo ?? '/priorities' });
    },
  });

  return <PriorityForm form={form} groups={groups} submitLabel="Save" />;
}

function priorityToFormDefaults(priority: {
  id: string;
  title: string;
  note: string | null;
  groupId: string | null;
}): PriorityInput {
  return {
    title: priority.title,
    note: priority.note ?? '',
    groupId: priority.groupId ?? undefined,
    groupName: '',
    groupSelection: priority.groupId ?? undefined,
  };
}
