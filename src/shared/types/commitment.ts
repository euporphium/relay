import type { CommitmentState } from '@/domain/commitment/commitmentStates';
import type { SharePermission } from '@/domain/share/sharePermissions';

export type Commitment = {
  id: string;
  title: string;
  note: string | null;
  state: CommitmentState;
  position: number;
  groupId: string | null;
  updatedAt: Date;
};

export type CommitmentGroupAccess = {
  isOwner: boolean;
  canEdit: boolean;
  permission: SharePermission;
};

export type CommitmentGroup = {
  id: string | null;
  name: string;
  commitments: Commitment[];
  access: CommitmentGroupAccess;
};

export type CommitmentGroupOption = {
  id: string;
  name: string;
};
