import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Commitment, CommitmentGroup } from '@/shared/types/commitment';
import { CommitmentGroupSharePopover } from './CommitmentGroupSharePopover';
import { CommitmentRow, SortableCommitmentRow } from './CommitmentRow';

type CommitmentGroupCardProps = {
  group: CommitmentGroup;
  onReorder: (groupId: string | null, orderedIds: string[]) => Promise<void>;
  onRename: (groupId: string, name: string) => Promise<void>;
  onLeaveShare: (groupId: string) => Promise<void>;
  onEdit: (id: string) => void;
  onChangeState: (
    id: string,
    state: CommitmentGroup['commitments'][number]['state'],
  ) => void;
};

export function CommitmentGroupCard({
  group,
  onReorder,
  onRename,
  onLeaveShare,
  onEdit,
  onChangeState,
}: CommitmentGroupCardProps) {
  const activeCommitments = group.commitments.filter(
    (commitment) => commitment.state === 'active',
  );
  const inactiveCommitments = group.commitments.filter(
    (commitment) => commitment.state !== 'active',
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

  const activeById = new Map(
    activeCommitments.map((commitment) => [commitment.id, commitment]),
  );

  const orderedActiveCommitments = activeOrder
    .map((id) => activeById.get(id))
    .filter((commitment): commitment is Commitment => Boolean(commitment));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const canEdit = group.access.canEdit;
  const canRename = group.id !== null && canEdit;
  const canLeave = group.id !== null && !group.access.isOwner;
  const leaveGroupId = canLeave ? group.id : null;

  const commitNameChange = async () => {
    if (group.id === null) return;
    const groupId = group.id;
    const nextName = draftName.trim();
    setIsEditing(false);
    if (!nextName || nextName === group.name) {
      setDraftName(group.name);
      return;
    }
    await onRename(groupId, nextName);
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
        <div className="flex items-center gap-2">
          {group.id && group.access.isOwner ? (
            <CommitmentGroupSharePopover groupId={group.id} />
          ) : null}
          {leaveGroupId ? (
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => void onLeaveShare(leaveGroupId)}
            >
              Leave
            </Button>
          ) : null}
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="shrink-0"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => setIsOpen((previous) => !previous)}
          >
            {isOpen ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="space-y-3" id={contentId}>
          {group.commitments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No commitments in this group
            </p>
          ) : (
            <>
              {canEdit ? (
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
                        onEdit={onEdit}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                orderedActiveCommitments.map((commitment) => (
                  <CommitmentRow
                    key={commitment.id}
                    commitment={commitment}
                    onChangeState={onChangeState}
                    onEdit={onEdit}
                    canEdit={false}
                  />
                ))
              )}
              {inactiveCommitments.map((commitment) => (
                <CommitmentRow
                  key={commitment.id}
                  commitment={commitment}
                  onChangeState={onChangeState}
                  onEdit={onEdit}
                  canEdit={canEdit}
                />
              ))}
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
}
