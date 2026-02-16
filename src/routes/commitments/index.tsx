import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { CommitmentState } from '@/domain/commitment/commitmentStates';
import { CommitmentGroupCard } from '@/features/commitments/components/CommitmentGroupCard';
import { Route as CommitmentsEditRoute } from '@/routes/commitments/$commitmentId';
import { Route as CommitmentsCreateRoute } from '@/routes/commitments/create';
import { getCommitments } from '@/server/commitments/getCommitments';
import { getPendingCommitmentGroupInvitations } from '@/server/commitments/getPendingCommitmentGroupInvitations';
import { leaveCommitmentGroup } from '@/server/commitments/leaveCommitmentGroup';
import { reorderCommitments } from '@/server/commitments/reorderCommitments';
import { respondToCommitmentGroupInvitation } from '@/server/commitments/respondToCommitmentGroupInvitation';
import { updateCommitmentGroupName } from '@/server/commitments/updateCommitmentGroupName';
import { updateCommitmentState } from '@/server/commitments/updateCommitmentState';

export const Route = createFileRoute('/commitments/')({
  loader: async () => {
    const [commitments, invitations] = await Promise.all([
      getCommitments(),
      getPendingCommitmentGroupInvitations({ data: {} }),
    ]);
    return {
      groups: commitments.groups,
      invitations: invitations.invitations,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { groups, invitations } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const reorderCommitmentsFn = useServerFn(reorderCommitments);
  const updateCommitmentGroupNameFn = useServerFn(updateCommitmentGroupName);
  const updateCommitmentStateFn = useServerFn(updateCommitmentState);
  const respondToInvitationFn = useServerFn(respondToCommitmentGroupInvitation);
  const leaveCommitmentGroupFn = useServerFn(leaveCommitmentGroup);

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

  async function handleInvitationResponse(
    invitationId: string,
    decision: 'accept' | 'reject',
  ) {
    try {
      await respondToInvitationFn({ data: { invitationId, decision } });
      toast.success(
        decision === 'accept' ? 'Invitation accepted' : 'Invitation rejected',
      );
      void router.invalidate();
    } catch {
      toast.error('Failed to respond to invitation');
    }
  }

  async function handleLeaveShare(groupId: string) {
    try {
      await leaveCommitmentGroupFn({ data: { groupId } });
      toast.success('You left the shared group');
      void router.invalidate();
    } catch {
      toast.error('Failed to leave shared group');
    }
  }

  function handleEdit(id: string) {
    navigate({
      to: CommitmentsEditRoute.to,
      params: { commitmentId: id },
      search: { returnTo: location.pathname + location.search },
    });
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

      {invitations.length > 0 ? (
        <section className="rounded-xl border border-border/70 bg-card px-4 py-3 space-y-3">
          <h2 className="text-sm font-semibold">Pending invitations</h2>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.invitationId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{invitation.groupName}</p>
                  <p className="text-xs text-muted-foreground">
                    From {invitation.ownerName} ({invitation.ownerEmail})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invitation.permission === 'edit' ? 'Can edit' : 'Can view'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      void handleInvitationResponse(
                        invitation.invitationId,
                        'reject',
                      )
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    onClick={() =>
                      void handleInvitationResponse(
                        invitation.invitationId,
                        'accept',
                      )
                    }
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
            onLeaveShare={handleLeaveShare}
            onChangeState={handleStateChange}
            onEdit={handleEdit}
          />
        ))
      )}
    </div>
  );
}
