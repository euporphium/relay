import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { CommitmentForm } from '@/features/commitments/forms/CommitmentForm';
import { getCommitment } from '@/server/commitments/getCommitment';
import { getCommitmentGroups } from '@/server/commitments/getCommitmentGroups';
import { updateCommitment } from '@/server/commitments/updateCommitment';
import type { CommitmentInput } from '@/shared/validation/commitmentInput.schema';
import { commitmentInputSchema } from '@/shared/validation/commitmentInput.schema';

export const Route = createFileRoute('/commitments/$commitmentId')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  loader: async ({ params }) => {
    const [commitment, { groups }] = await Promise.all([
      getCommitment({ data: params.commitmentId }),
      getCommitmentGroups(),
    ]);

    if (!commitment) {
      throw notFound();
    }

    return { commitment, groups };
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <div>
      <h1>Commitment not found</h1>
      <p>The commitment you're looking for doesn't exist.</p>
    </div>
  ),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();
  const { commitment, groups } = Route.useLoaderData();

  const form = useAppForm({
    defaultValues: commitmentToFormDefaults(commitment),
    validators: { onSubmit: commitmentInputSchema },
    onSubmit: async ({ value }) => {
      await updateCommitment({
        data: { id: commitment.id, updates: value },
      });

      void navigate({ to: returnTo ?? '/commitments' });
    },
  });

  return <CommitmentForm form={form} groups={groups} submitLabel="Save" />;
}

function commitmentToFormDefaults(commitment: {
  id: string;
  title: string;
  note: string | null;
  groupId: string | null;
}): CommitmentInput {
  return {
    title: commitment.title,
    note: commitment.note ?? '',
    groupId: commitment.groupId ?? undefined,
    groupName: '',
    groupSelection: commitment.groupId ?? undefined,
  };
}
