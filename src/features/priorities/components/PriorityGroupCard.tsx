import { closestCenter, DndContext } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  CaretDownIcon,
  CaretUpIcon,
  MinusCircleIcon,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePointerType } from '@/hooks/usePointerType';
import { useResponsiveSortableSensors } from '@/hooks/useResponsiveSortableSensors';
import { cn } from '@/lib/utils';
import type { Priority, PriorityGroup } from '@/shared/types/priority';
import { PriorityGroupSharePopover } from './PriorityGroupSharePopover';
import { PriorityRow, SortablePriorityRow } from './PriorityRow';
import { PrioritySection } from './PrioritySection';

type PriorityGroupCardProps = {
  group: PriorityGroup;
  onReorder: (groupId: string | null, orderedIds: string[]) => Promise<void>;
  onRename: (groupId: string, name: string) => Promise<void>;
  onLeaveShare: (groupId: string) => Promise<void>;
  onEdit: (id: string) => void;
  onChangeState: (
    id: string,
    state: PriorityGroup['priorities'][number]['state'],
  ) => void;
};

export function PriorityGroupCard({
  group,
  onReorder,
  onRename,
  onLeaveShare,
  onEdit,
  onChangeState,
}: PriorityGroupCardProps) {
  const activePriorities = group.priorities.filter(
    (priority) => priority.state === 'active',
  );
  const inactivePriorities = group.priorities.filter(
    (priority) => priority.state !== 'active',
  );

  const [activeOrder, setActiveOrder] = useState<string[]>(() =>
    activePriorities.map((priority) => priority.id),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { pointerType } = usePointerType();
  const { sensors } = useResponsiveSortableSensors({ pointerType });

  useEffect(() => {
    setActiveOrder(activePriorities.map((priority) => priority.id));
  }, [activePriorities]);

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
    activePriorities.map((priority) => [priority.id, priority]),
  );

  const orderedActivePriorities = activeOrder
    .map((id) => activeById.get(id))
    .filter((priority): priority is Priority => Boolean(priority));

  const canEdit = group.access.canEdit;
  const canRename = group.id !== null && canEdit;
  const canLeave = group.id !== null && !group.access.isOwner;
  const leaveGroupId = canLeave ? group.id : null;
  const sharedByLabel = group.access.sharedByName ?? 'someone';
  const sectionId = `group:${group.id ?? 'ungrouped'}`;
  const triggerDragHaptic = () => {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.vibrate !== 'function'
    ) {
      return;
    }

    navigator.vibrate(25);
  };

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
    <Card className="p-6 md:p-8">
      <PrioritySection sectionId={sectionId}>
        {({ contentId, isOpen, toggle }) => (
          <div className="flex flex-col">
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
                    <h2 className="text-lg md:text-xl font-semibold">
                      {group.name}
                    </h2>
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
                  {group.priorities.length}{' '}
                  {group.priorities.length === 1 ? 'priority' : 'priorities'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {group.id && group.access.isOwner ? (
                  <PriorityGroupSharePopover groupId={group.id} />
                ) : null}
                {leaveGroupId ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    <span>{sharedByLabel}</span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="size-5"
                      onClick={() => void onLeaveShare(leaveGroupId)}
                      aria-label="Leave shared group"
                    >
                      <MinusCircleIcon size={12} />
                    </Button>
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0"
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  aria-label={
                    isOpen ? 'Collapse priorities' : 'Expand priorities'
                  }
                  onClick={toggle}
                >
                  {isOpen ? (
                    <CaretUpIcon size={16} />
                  ) : (
                    <CaretDownIcon size={16} />
                  )}
                </Button>
              </div>
            </div>

            <div
              className={cn(
                'grid transition-all duration-200 ease-out',
                isOpen
                  ? 'mt-4 grid-rows-[1fr] opacity-100'
                  : 'mt-0 grid-rows-[0fr] opacity-0 pointer-events-none',
              )}
              id={contentId}
              aria-hidden={!isOpen}
            >
              <div className="space-y-3 overflow-hidden">
                {group.priorities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No priorities in this group
                  </p>
                ) : (
                  <>
                    {canEdit ? (
                      <DndContext
                        id={`priorities-dnd-${sectionId}`}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={() => {
                          if (pointerType === 'coarse') {
                            triggerDragHaptic();
                          }
                        }}
                        onDragEnd={async ({ active, over }) => {
                          if (!over || active.id === over.id) return;
                          const oldIndex = activeOrder.indexOf(
                            String(active.id),
                          );
                          const newIndex = activeOrder.indexOf(String(over.id));
                          if (oldIndex === -1 || newIndex === -1) return;

                          const previous = activeOrder;
                          const next = arrayMove(
                            activeOrder,
                            oldIndex,
                            newIndex,
                          );
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
                          {orderedActivePriorities.map((priority) => (
                            <SortablePriorityRow
                              key={priority.id}
                              priority={priority}
                              onChangeState={onChangeState}
                              onEdit={onEdit}
                              pointerType={pointerType}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      orderedActivePriorities.map((priority) => (
                        <PriorityRow
                          key={priority.id}
                          priority={priority}
                          onChangeState={onChangeState}
                          onEdit={onEdit}
                          canEdit={false}
                        />
                      ))
                    )}
                    {inactivePriorities.map((priority) => (
                      <PriorityRow
                        key={priority.id}
                        priority={priority}
                        onChangeState={onChangeState}
                        onEdit={onEdit}
                        canEdit={canEdit}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </PrioritySection>
    </Card>
  );
}
