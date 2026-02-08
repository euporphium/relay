import { useServerFn } from '@tanstack/react-start';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { createCommitmentGroupShare } from '@/server/commitments/createCommitmentGroupShare';
import {
  type CommitmentGroupShare,
  getCommitmentGroupShares,
} from '@/server/commitments/getCommitmentGroupShares';
import { removeCommitmentGroupShare } from '@/server/commitments/removeCommitmentGroupShare';
import { updateCommitmentGroupShare } from '@/server/commitments/updateCommitmentGroupShare';

type CommitmentGroupSharePopoverProps = {
  groupId: string;
};

const permissionOptions: Array<{
  value: SharePermission;
  label: string;
}> = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

export function CommitmentGroupSharePopover({
  groupId,
}: CommitmentGroupSharePopoverProps) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<CommitmentGroupShare[]>([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getSharesFn = useServerFn(getCommitmentGroupShares);
  const addShareFn = useServerFn(createCommitmentGroupShare);
  const updateShareFn = useServerFn(updateCommitmentGroupShare);
  const removeShareFn = useServerFn(removeCommitmentGroupShare);

  const loadShares = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSharesFn({ data: { groupId } });
      setShares(result.shares);
    } catch {
      toast.error('Failed to load shares');
    } finally {
      setIsLoading(false);
    }
  }, [getSharesFn, groupId]);

  useEffect(() => {
    if (!open) return;
    void loadShares();
  }, [open, loadShares]);

  const handleAdd = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await addShareFn({
        data: { groupId, email: trimmed, permission },
      });
      setEmail('');
      await loadShares();
    } catch {
      toast.error('Failed to share group');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionChange = async (
    share: CommitmentGroupShare,
    nextPermission: SharePermission,
  ) => {
    if (share.permission === nextPermission) return;
    try {
      await updateShareFn({
        data: {
          groupId,
          sharedWithUserId: share.userId,
          permission: nextPermission,
        },
      });
      setShares((current) =>
        current.map((item) =>
          item.userId === share.userId
            ? { ...item, permission: nextPermission }
            : item,
        ),
      );
    } catch {
      toast.error('Failed to update share');
    }
  };

  const handleRemove = async (share: CommitmentGroupShare) => {
    try {
      await removeShareFn({
        data: { groupId, sharedWithUserId: share.userId },
      });
      setShares((current) =>
        current.filter((item) => item.userId !== share.userId),
      );
    } catch {
      toast.error('Failed to remove access');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="xs" variant="outline">
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Share group</PopoverTitle>
          <PopoverDescription>
            Grant view or edit access to another user.
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Select
                value={permission}
                onValueChange={(value) =>
                  setPermission(value as SharePermission)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {permissionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleAdd()}
                disabled={isSaving}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Shared with
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one has access yet.
              </p>
            ) : (
              shares.map((share) => (
                <div
                  key={share.userId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{share.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {share.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={share.permission}
                      onValueChange={(value) =>
                        void handlePermissionChange(
                          share,
                          value as SharePermission,
                        )
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => void handleRemove(share)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
