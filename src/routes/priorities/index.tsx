import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PriorityState } from '@/domain/priority/priorityStates';
import { PriorityGroupCard } from '@/features/priorities/components/PriorityGroupCard';
import { Route as PrioritiesEditRoute } from '@/routes/priorities/$priorityId';
import { Route as PrioritiesCreateRoute } from '@/routes/priorities/create';
import { getPendingPriorityGroupInvitations } from '@/server/priorities/getPendingPriorityGroupInvitations';
import { getPriorities } from '@/server/priorities/getPriorities';
import { leavePriorityGroup } from '@/server/priorities/leavePriorityGroup';
import { reorderPriorities } from '@/server/priorities/reorderPriorities';
import { respondToPriorityGroupInvitation } from '@/server/priorities/respondToPriorityGroupInvitation';
import { updatePriorityGroupName } from '@/server/priorities/updatePriorityGroupName';
import { updatePriorityState } from '@/server/priorities/updatePriorityState';

export const Route = createFileRoute('/priorities/')({
  loader: async () => {
    const [priorities, invitations] = await Promise.all([
      getPriorities(),
      getPendingPriorityGroupInvitations({ data: {} }),
    ]);
    return {
      groups: priorities.groups,
      invitations: invitations.invitations,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { groups, invitations } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const reorderPrioritiesFn = useServerFn(reorderPriorities);
  const updatePriorityGroupNameFn = useServerFn(updatePriorityGroupName);
  const updatePriorityStateFn = useServerFn(updatePriorityState);
  const respondToInvitationFn = useServerFn(respondToPriorityGroupInvitation);
  const leavePriorityGroupFn = useServerFn(leavePriorityGroup);

  async function handleReorder(groupId: string | null, orderedIds: string[]) {
    if (orderedIds.length < 2) return;
    try {
      await reorderPrioritiesFn({ data: { groupId, orderedIds } });
      void router.invalidate();
    } catch (error) {
      toast.error('Failed to reorder priorities');
      throw error;
    }
  }

  async function handleStateChange(id: string, state: PriorityState) {
    try {
      await updatePriorityStateFn({ data: { id, state } });
      void router.invalidate();
    } catch {
      toast.error('Failed to update priority');
    }
  }

  async function handleRenameGroup(groupId: string, name: string) {
    try {
      await updatePriorityGroupNameFn({ data: { id: groupId, name } });
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
      await leavePriorityGroupFn({ data: { groupId } });
      toast.success('You left the shared group');
      void router.invalidate();
    } catch {
      toast.error('Failed to leave shared group');
    }
  }

  function handleEdit(id: string) {
    navigate({
      to: PrioritiesEditRoute.to,
      params: { priorityId: id },
      search: { returnTo: location.pathname + location.search },
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-12 flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-xl bg-muted/30 px-4 py-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Priorities</h1>
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
            to: PrioritiesCreateRoute.to,
            search: { returnTo: location.pathname + location.search },
          })
        }
      >
        Create Priority
      </Button>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No priorities yet. Create one to get started.
        </p>
      ) : (
        groups.map((group) => (
          <PriorityGroupCard
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
