import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Commitment } from '@/shared/types/commitment';

const stateLabels: Record<Commitment['state'], string> = {
  active: 'Active',
  fulfilled: 'Fulfilled',
  released: 'Released',
};

type CommitmentRowProps = {
  commitment: Commitment;
  onChangeState: (id: string, state: Commitment['state']) => void;
  onEdit: (id: string) => void;
  containerProps?: ComponentPropsWithRef<'div'>;
  dragHandleProps?: ComponentPropsWithoutRef<'button'>;
  isDragging?: boolean;
  canEdit?: boolean;
};

export function CommitmentRow({
  commitment,
  onChangeState,
  onEdit,
  containerProps,
  dragHandleProps,
  isDragging,
  canEdit = true,
}: CommitmentRowProps) {
  const isActive = commitment.state === 'active';
  const showDragHandle = canEdit && isActive;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-4',
        isDragging && 'opacity-70',
      )}
      {...containerProps}
    >
      {canEdit ? (
        showDragHandle ? (
          <button
            type="button"
            aria-label="Reorder commitment"
            {...dragHandleProps}
            className={cn(
              '-ml-1 flex size-11 shrink-0 select-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation',
              dragHandleProps?.className,
            )}
          >
            <DotsSixVerticalIcon size={18} weight="bold" />
          </button>
        ) : (
          <div className="size-11 shrink-0" aria-hidden />
        )
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-sm font-semibold">
              {commitment.title}
            </h3>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {stateLabels[commitment.state]}
            </span>
          </div>
          {commitment.note ? (
            <p className="min-w-0 break-words text-sm text-muted-foreground">
              {commitment.note}
            </p>
          ) : null}
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            {isActive ? (
              <>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => onEdit(commitment.id)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => onChangeState(commitment.id, 'fulfilled')}
                >
                  Fulfill
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => onChangeState(commitment.id, 'released')}
                >
                  Release
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => onEdit(commitment.id)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => onChangeState(commitment.id, 'active')}
                >
                  Reactivate
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type SortableCommitmentRowProps = {
  commitment: Commitment;
  onChangeState: (id: string, state: Commitment['state']) => void;
  onEdit: (id: string) => void;
};

export function SortableCommitmentRow({
  commitment,
  onChangeState,
  onEdit,
}: SortableCommitmentRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: commitment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <CommitmentRow
      commitment={commitment}
      onChangeState={onChangeState}
      onEdit={onEdit}
      isDragging={isDragging}
      canEdit
      containerProps={{ ref: setNodeRef, style }}
      dragHandleProps={{
        ...attributes,
        ...listeners,
        className: cn('select-none touch-none'),
        style: { touchAction: 'none' },
      }}
    />
  );
}
