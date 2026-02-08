import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import {
  type CommitmentInput,
  commitmentInputSchema,
} from '@/domain/commitment/commitmentInput.schema';
import { CommitmentForm } from '@/features/commitments/forms/CommitmentForm';
import { createCommitment } from '@/server/commitments/createCommitment';
import { getCommitmentGroups } from '@/server/commitments/getCommitmentGroups';

export const Route = createFileRoute('/commitments/create')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  loader: async () => getCommitmentGroups(),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();
  const { groups } = Route.useLoaderData();

  const defaultValues: CommitmentInput = {
    title: '',
    note: '',
    groupId: undefined,
    groupName: '',
    groupSelection: undefined,
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: commitmentInputSchema },
    onSubmit: async ({ value }) => {
      await createCommitment({ data: value });
      form.reset();
      void navigate({ to: returnTo ?? '/commitments' });
    },
  });

  return <CommitmentForm form={form} groups={groups} submitLabel="Create" />;
}
