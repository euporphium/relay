import { ShareIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { usePriorityGroupShares } from '../hooks/usePriorityGroupShares';
import { ShareRow } from './ShareRow';

type PriorityGroupSharePopoverProps = {
  groupId: string;
};

const invitePermissionOptions: Array<{
  label: string;
  value: SharePermission;
}> = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

const inviteShareSchema = z.object({
  email: z.email('Please enter a valid email address'),
  permission: z.enum(['view', 'edit']),
});

export function PriorityGroupSharePopover({
  groupId,
}: PriorityGroupSharePopoverProps) {
  const [open, setOpen] = useState(false);
  const {
    acceptedShares,
    pendingInvitations,
    isLoading,
    loadShares,
    addShare,
    updateShare,
    removeShare,
  } = usePriorityGroupShares(groupId);

  const form = useAppForm({
    defaultValues: {
      email: '',
      permission: 'view' as SharePermission,
    },
    validators: { onSubmit: inviteShareSchema },
    onSubmit: async ({ value }) => {
      try {
        const result = await addShare(value);
        form.reset();
        setOpen(false);
        if (result.status === 'accepted') {
          toast.success('Share updated');
        } else {
          toast.success('Invitation sent');
        }
      } catch {
        toast.error('Failed to send invitation');
      }
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;
    void loadShares().catch(() => {
      toast.error('Failed to load shares');
    });
  };

  const handlePermissionChange = async (
    share: (typeof acceptedShares)[number],
    nextPermission: SharePermission,
  ) => {
    try {
      await updateShare({ share, permission: nextPermission });
    } catch {
      toast.error('Failed to update share');
    }
  };

  const handleRemove = async (share: (typeof acceptedShares)[number]) => {
    try {
      await removeShare(share);
    } catch {
      toast.error('Failed to remove access');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Share group"
        >
          <ShareIcon size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <div className="flex items-center justify-between gap-2">
            <PopoverTitle>Share group</PopoverTitle>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={() => setOpen(false)}
              aria-label="Close share popover"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
          <PopoverDescription>
            Send invitations and manage accepted access.
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              await form.handleSubmit();
            }}
          >
            <form.AppField name="email">
              {(field) => (
                <field.Input
                  label="Email"
                  type="email"
                  description="Invite by email"
                />
              )}
            </form.AppField>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <form.AppField name="permission">
                  {(field) => (
                    <field.Select
                      label="Permission"
                      options={invitePermissionOptions}
                    />
                  )}
                </form.AppField>
              </div>
              <form.AppForm>
                <form.SubmitButton label="Invite" />
              </form.AppForm>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pending invitations
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : pendingInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending invitations.
              </p>
            ) : (
              pendingInvitations.map((share) => (
                <ShareRow
                  key={share.id}
                  share={share}
                  onPermissionChange={(permission) =>
                    void handlePermissionChange(share, permission)
                  }
                  onRemove={() => void handleRemove(share)}
                />
              ))
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Shared members
            </p>
            {isLoading ? null : acceptedShares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No accepted members yet.
              </p>
            ) : (
              acceptedShares.map((share) => (
                <ShareRow
                  key={share.id}
                  share={share}
                  showName
                  onPermissionChange={(permission) =>
                    void handlePermissionChange(share, permission)
                  }
                  onRemove={() => void handleRemove(share)}
                />
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
