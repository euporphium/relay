import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { CommitmentState } from '@/domain/commitment/commitmentStates';
import { CommitmentGroupCard } from '@/features/commitments/components/CommitmentGroupCard';
import { Route as CommitmentsCreateRoute } from '@/routes/commitments/create';
import { getCommitments } from '@/server/commitments/getCommitments';
import { reorderCommitments } from '@/server/commitments/reorderCommitments';
import { updateCommitmentGroupName } from '@/server/commitments/updateCommitmentGroupName';
import { updateCommitmentState } from '@/server/commitments/updateCommitmentState';

export const Route = createFileRoute('/commitments/')({
  loader: async () => getCommitments(),
  component: RouteComponent,
});

function RouteComponent() {
  const { groups } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const reorderCommitmentsFn = useServerFn(reorderCommitments);
  const updateCommitmentGroupNameFn = useServerFn(updateCommitmentGroupName);
  const updateCommitmentStateFn = useServerFn(updateCommitmentState);

  async function handleReorder(groupId: string | null, orderedIds: string[]) {
    if (orderedIds.length < 2) return;
    try {
      await reorderCommitmentsFn({ data: { groupId, orderedIds } });
      void router.invalidate();
    } catch (error) {
      toast.error('Failed to reorder commitments');
      throw error;
    }
  }

  async function handleStateChange(id: string, state: CommitmentState) {
    try {
      await updateCommitmentStateFn({ data: { id, state } });
      void router.invalidate();
    } catch {
      toast.error('Failed to update commitment');
    }
  }

  async function handleRenameGroup(groupId: string, name: string) {
    try {
      await updateCommitmentGroupNameFn({ data: { id: groupId, name } });
      void router.invalidate();
    } catch {
      toast.error('Failed to update group name');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-12 flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-xl bg-muted/30 px-4 py-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Commitments</h1>
          <p className="text-sm text-muted-foreground">
            Keep what matters without assigning a date.
          </p>
        </div>
      </header>

      <Button
        onClick={() =>
          navigate({
            to: CommitmentsCreateRoute.to,
            search: { returnTo: location.pathname + location.search },
          })
        }
      >
        Create Commitment
      </Button>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No commitments yet. Create one to get started.
        </p>
      ) : (
        groups.map((group) => (
          <CommitmentGroupCard
            key={group.id ?? 'ungrouped'}
            group={group}
            onReorder={handleReorder}
            onRename={handleRenameGroup}
            onChangeState={handleStateChange}
          />
        ))
      )}
    </div>
  );
}
