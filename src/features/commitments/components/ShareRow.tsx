import { UserMinusIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SharePermission } from '@/domain/share/sharePermissions';
import type { CommitmentGroupShare } from '@/server/commitments/getCommitmentGroupShares';

const permissionOptions: Array<{
  value: SharePermission;
  label: string;
}> = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

type ShareRowProps = {
  share: CommitmentGroupShare;
  onPermissionChange: (permission: SharePermission) => void;
  onRemove: () => void;
  showName?: boolean;
};

export function ShareRow({
  share,
  onPermissionChange,
  onRemove,
  showName = false,
}: ShareRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
      <div className="flex flex-col">
        {showName ? (
          <>
            <span className="text-sm font-medium">
              {share.name ?? share.email}
            </span>
            <span className="text-xs text-muted-foreground">{share.email}</span>
          </>
        ) : (
          <span className="text-sm font-medium">{share.email}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={share.permission}
          onValueChange={(value) =>
            onPermissionChange(value as SharePermission)
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
          size="icon-xs"
          variant="ghost"
          onClick={onRemove}
          aria-label={`Remove ${share.email} from shared group`}
        >
          <UserMinusIcon size={12} />
        </Button>
      </div>
    </div>
  );
}
