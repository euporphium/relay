import type {
  PriorityGroup,
  PriorityGroupAccess,
} from '@/shared/types/priority';
import type { PriorityState } from './priorityStates';

const UNGROUPED_NAME = 'Ungrouped';

const DEFAULT_ACCESS: PriorityGroupAccess = {
  isOwner: true,
  canEdit: true,
  permission: 'edit',
  sharedByName: null,
};

const FALLBACK_ACCESS: PriorityGroupAccess = {
  isOwner: false,
  canEdit: false,
  permission: 'view',
  sharedByName: null,
};

export type PriorityGroupRow = {
  id: string;
  title: string;
  note: string | null;
  state: PriorityState;
  position: number;
  groupId: string | null;
  groupName: string | null;
  updatedAt: Date;
  access?: PriorityGroupAccess;
};

export function buildPriorityGroups(rows: PriorityGroupRow[]): PriorityGroup[] {
  const grouped = new Map<string | null, PriorityGroup>();

  for (const row of rows) {
    const groupId = row.groupId ?? null;
    const groupName = row.groupName ?? UNGROUPED_NAME;
    const access =
      row.access ?? (groupId === null ? DEFAULT_ACCESS : FALLBACK_ACCESS);

    if (!grouped.has(groupId)) {
      grouped.set(groupId, {
        id: groupId,
        name: groupName,
        priorities: [],
        access,
      });
    }

    grouped.get(groupId)?.priorities.push({
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
    const active = group.priorities
      .filter((priority) => priority.state === 'active')
      .sort((a, b) => a.position - b.position);
    const inactive = group.priorities
      .filter((priority) => priority.state !== 'active')
      .sort(
        (a, b) =>
          b.updatedAt.getTime() - a.updatedAt.getTime() ||
          a.title.localeCompare(b.title),
      );

    group.priorities = [...active, ...inactive];
  }

  return [...grouped.values()].sort((a, b) => {
    if (a.id === null && b.id === null) return 0;
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.name.localeCompare(b.name);
  });
}
