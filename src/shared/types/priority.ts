import type { PriorityState } from '@/domain/priority/priorityStates';
import type { SharePermission } from '@/domain/share/sharePermissions';

export type Priority = {
  id: string;
  title: string;
  note: string | null;
  state: PriorityState;
  position: number;
  groupId: string | null;
  updatedAt: Date;
};

export type PriorityGroupAccess = {
  isOwner: boolean;
  canEdit: boolean;
  permission: SharePermission;
  sharedByName: string | null;
};

export type PriorityGroup = {
  id: string | null;
  name: string;
  priorities: Priority[];
  access: PriorityGroupAccess;
};

export type PriorityGroupOption = {
  id: string;
  name: string;
};
