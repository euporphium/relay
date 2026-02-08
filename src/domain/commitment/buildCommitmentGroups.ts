import type {
  CommitmentGroup,
  CommitmentGroupAccess,
} from '@/shared/types/commitment';
import type { CommitmentState } from './commitmentStates';

const UNGROUPED_NAME = 'Ungrouped';

const DEFAULT_ACCESS: CommitmentGroupAccess = {
  isOwner: true,
  canEdit: true,
  permission: 'edit',
};

const FALLBACK_ACCESS: CommitmentGroupAccess = {
  isOwner: false,
  canEdit: false,
  permission: 'view',
};

export type CommitmentGroupRow = {
  id: string;
  title: string;
  note: string | null;
  state: CommitmentState;
  position: number;
  groupId: string | null;
  groupName: string | null;
  updatedAt: Date;
  access?: CommitmentGroupAccess;
};

export function buildCommitmentGroups(
  rows: CommitmentGroupRow[],
): CommitmentGroup[] {
  const grouped = new Map<string | null, CommitmentGroup>();

  for (const row of rows) {
    const groupId = row.groupId ?? null;
    const groupName = row.groupName ?? UNGROUPED_NAME;
    const access =
      row.access ?? (groupId === null ? DEFAULT_ACCESS : FALLBACK_ACCESS);

    if (!grouped.has(groupId)) {
      grouped.set(groupId, {
        id: groupId,
        name: groupName,
        commitments: [],
        access,
      });
    }

    grouped.get(groupId)?.commitments.push({
      id: row.id,
      title: row.title,
      note: row.note ?? null,
      state: row.state,
      position: row.position,
      groupId,
      updatedAt: row.updatedAt,
    });
  }

  for (const group of grouped.values()) {
    const active = group.commitments
      .filter((commitment) => commitment.state === 'active')
      .sort((a, b) => a.position - b.position);
    const inactive = group.commitments
      .filter((commitment) => commitment.state !== 'active')
      .sort(
        (a, b) =>
          b.updatedAt.getTime() - a.updatedAt.getTime() ||
          a.title.localeCompare(b.title),
      );

    group.commitments = [...active, ...inactive];
  }

  return [...grouped.values()].sort((a, b) => {
    if (a.id === null && b.id === null) return 0;
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.name.localeCompare(b.name);
  });
}
