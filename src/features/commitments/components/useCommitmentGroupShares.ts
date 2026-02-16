import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import type { SharePermission } from '@/domain/share/sharePermissions';
import { createCommitmentGroupShare } from '@/server/commitments/createCommitmentGroupShare';
import {
  type CommitmentGroupShare,
  getCommitmentGroupShares,
} from '@/server/commitments/getCommitmentGroupShares';
import { removeCommitmentGroupShare } from '@/server/commitments/removeCommitmentGroupShare';
import { updateCommitmentGroupShare } from '@/server/commitments/updateCommitmentGroupShare';

type AddShareInput = {
  email: string;
  permission: SharePermission;
};

type UpdateShareInput = {
  share: CommitmentGroupShare;
  permission: SharePermission;
};

export function useCommitmentGroupShares(groupId: string) {
  const [shares, setShares] = useState<CommitmentGroupShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSharesFn = useServerFn(getCommitmentGroupShares);
  const addShareFn = useServerFn(createCommitmentGroupShare);
  const updateShareFn = useServerFn(updateCommitmentGroupShare);
  const removeShareFn = useServerFn(removeCommitmentGroupShare);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const result = await getSharesFn({ data: { groupId } });
      setShares([...result.pendingInvitations, ...result.acceptedShares]);
    } finally {
      setIsLoading(false);
    }
  };

  const addShare = async ({ email, permission }: AddShareInput) => {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await addShareFn({
      data: { groupId, email: normalizedEmail, permission },
    });

    setShares((current) => {
      const existingIndex = current.findIndex(
        (share) => share.email.trim().toLowerCase() === normalizedEmail,
      );
      const nextShare: CommitmentGroupShare = {
        id:
          existingIndex >= 0 ? current[existingIndex].id : crypto.randomUUID(),
        userId:
          result.sharedWithUserId ??
          (existingIndex >= 0 ? current[existingIndex].userId : null),
        name:
          result.status === 'accepted'
            ? existingIndex >= 0
              ? current[existingIndex].name
              : null
            : null,
        email: normalizedEmail,
        permission,
        status: result.status,
        invitedAt:
          existingIndex >= 0 ? current[existingIndex].invitedAt : new Date(),
        acceptedAt:
          result.status === 'accepted'
            ? existingIndex >= 0
              ? current[existingIndex].acceptedAt
              : new Date()
            : null,
      };

      if (existingIndex >= 0) {
        return current.map((share, index) =>
          index === existingIndex ? nextShare : share,
        );
      }

      return [...current, nextShare];
    });

    return result;
  };

  const updateShare = async ({ share, permission }: UpdateShareInput) => {
    if (share.permission === permission) return;
    await updateShareFn({
      data: { groupId, shareId: share.id, permission },
    });

    setShares((current) =>
      current.map((item) =>
        item.id === share.id ? { ...item, permission } : item,
      ),
    );
  };

  const removeShare = async (share: CommitmentGroupShare) => {
    await removeShareFn({
      data: { groupId, shareId: share.id },
    });

    setShares((current) => current.filter((item) => item.id !== share.id));
  };

  const acceptedShares = shares.filter((share) => share.status === 'accepted');
  const pendingInvitations = shares.filter(
    (share) => share.status === 'pending',
  );

  return {
    shares,
    acceptedShares,
    pendingInvitations,
    isLoading,
    loadShares,
    addShare,
    updateShare,
    removeShare,
  };
}
