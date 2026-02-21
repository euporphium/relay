import { describe, expect, test } from 'vitest';
import { buildPriorityGroups } from './buildPriorityGroups';

describe('buildPriorityGroups', () => {
  test('groups and orders priorities by rules', () => {
    const now = new Date('2024-01-02T10:00:00Z');
    const earlier = new Date('2024-01-01T10:00:00Z');

    const groups = buildPriorityGroups([
      {
        id: 'c1',
        title: 'Task B',
        note: null,
        state: 'active',
        position: 2,
        groupId: 'g1',
        groupName: 'Alpha',
        updatedAt: earlier,
      },
      {
        id: 'c2',
        title: 'Task A',
        note: null,
        state: 'active',
        position: 1,
        groupId: 'g1',
        groupName: 'Alpha',
        updatedAt: earlier,
      },
      {
        id: 'c3',
        title: 'Task Z',
        note: null,
        state: 'active',
        position: 1,
        groupId: 'g2',
        groupName: 'Beta',
        updatedAt: earlier,
      },
      {
        id: 'c4',
        title: 'Inactive B',
        note: null,
        state: 'completed',
        position: 3,
        groupId: 'g1',
        groupName: 'Alpha',
        updatedAt: now,
      },
      {
        id: 'c5',
        title: 'Inactive A',
        note: null,
        state: 'released',
        position: 4,
        groupId: 'g1',
        groupName: 'Alpha',
        updatedAt: now,
      },
      {
        id: 'c6',
        title: 'Ungrouped',
        note: null,
        state: 'active',
        position: 1,
        groupId: null,
        groupName: null,
        updatedAt: earlier,
      },
    ]);

    expect(groups.map((group) => group.name)).toEqual([
      'Alpha',
      'Beta',
      'Ungrouped',
    ]);

    const alphaPriorities = groups[0]?.priorities ?? [];
    expect(alphaPriorities.map((priority) => priority.id)).toEqual([
      'c2',
      'c1',
      'c5',
      'c4',
    ]);
  });
});
