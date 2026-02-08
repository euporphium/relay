import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { CommitmentGroup } from '@/server/commitments/getCommitments';
import { CommitmentRow, SortableCommitmentRow } from './CommitmentRow';

type CommitmentGroupCardProps = {
  group: CommitmentGroup;
  onReorder: (groupId: string | null, orderedIds: string[]) => Promise<void>;
  onRename: (groupId: string, name: string) => Promise<void>;
  onChangeState: (
    id: string,
    state: CommitmentGroup['commitments'][number]['state'],
  ) => void;
};

export function CommitmentGroupCard({
  group,
  onReorder,
  onRename,
  onChangeState,
}: CommitmentGroupCardProps) {
  const activeCommitments = useMemo(
    () => group.commitments.filter((commitment) => commitment.state === 'active'),
    [group.commitments],
  );
  const inactiveCommitments = useMemo(
    () => group.commitments.filter((commitment) => commitment.state !== 'active'),
    [group.commitments],
  );
  const [activeOrder, setActiveOrder] = useState<string[]>(() =>
    activeCommitments.map((commitment) => commitment.id),
  );
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const contentId = useId();

  useEffect(() => {
    setActiveOrder(activeCommitments.map((commitment) => commitment.id));
  }, [activeCommitments]);

  useEffect(() => {
    setDraftName(group.name);
  }, [group.name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const activeById = useMemo(
    () => new Map(activeCommitments.map((commitment) => [commitment.id, commitment])),
    [activeCommitments],
  );

  const orderedActiveCommitments = useMemo(
    () =>
      activeOrder
        .map((id) => activeById.get(id))
        .filter((commitment): commitment is CommitmentGroup['commitments'][number] =>
          Boolean(commitment),
        ),
    [activeOrder, activeById],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canRename = group.id !== null;

  const commitNameChange = async () => {
    if (!canRename) return;
    const nextName = draftName.trim();
    setIsEditing(false);
    if (!nextName || nextName === group.name) {
      setDraftName(group.name);
      return;
    }
    await onRename(group.id, nextName);
  };

  return (
    <Card className="space-y-4 p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {isEditing && canRename ? (
            <Input
              ref={inputRef}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={() => void commitNameChange()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void commitNameChange();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setDraftName(group.name);
                  setIsEditing(false);
                }
              }}
              className="h-8 text-lg md:text-xl font-semibold"
              aria-label="Group name"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-semibold">{group.name}</h2>
              {canRename ? (
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              ) : null}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {group.commitments.length} commitment
            {group.commitments.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((previous) => !previous)}
        >
          {isOpen ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-3" id={contentId} role="region">
          {group.commitments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No commitments in this group
            </p>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={async ({ active, over }) => {
                  if (!over || active.id === over.id) return;
                  const oldIndex = activeOrder.indexOf(String(active.id));
                  const newIndex = activeOrder.indexOf(String(over.id));
                  if (oldIndex === -1 || newIndex === -1) return;

                  const previous = activeOrder;
                  const next = arrayMove(activeOrder, oldIndex, newIndex);
                  setActiveOrder(next);

                  try {
                    await onReorder(group.id, next);
                  } catch {
                    setActiveOrder(previous);
                  }
                }}
              >
                <SortableContext
                  items={activeOrder}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedActiveCommitments.map((commitment) => (
                    <SortableCommitmentRow
                      key={commitment.id}
                      commitment={commitment}
                      onChangeState={onChangeState}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {inactiveCommitments.map((commitment) => (
                <CommitmentRow
                  key={commitment.id}
                  commitment={commitment}
                  onChangeState={onChangeState}
                />
              ))}
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
}
