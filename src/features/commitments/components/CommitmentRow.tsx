import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CommitmentItem } from '@/server/commitments/getCommitments';

const stateLabels: Record<CommitmentItem['state'], string> = {
  active: 'Active',
  fulfilled: 'Fulfilled',
  released: 'Released',
};

type CommitmentRowProps = {
  commitment: CommitmentItem;
  onChangeState: (id: string, state: CommitmentItem['state']) => void;
  containerProps?: ComponentPropsWithRef<'div'>;
  dragHandleProps?: ComponentPropsWithoutRef<'button'>;
  isDragging?: boolean;
};

export function CommitmentRow({
  commitment,
  onChangeState,
  containerProps,
  dragHandleProps,
  isDragging,
}: CommitmentRowProps) {
  const isActive = commitment.state === 'active';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4',
        'md:flex-row md:items-center md:gap-4',
        isDragging && 'opacity-70',
      )}
      {...containerProps}
    >
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{commitment.title}</h3>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {stateLabels[commitment.state]}
          </span>
        </div>
        {commitment.note ? (
          <p className="text-sm text-muted-foreground">{commitment.note}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isActive ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            aria-label="Reorder commitment"
            {...dragHandleProps}
          >
            <DotsSixVerticalIcon size={16} />
          </Button>
        ) : null}

        {isActive ? (
          <>
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
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => onChangeState(commitment.id, 'active')}
          >
            Reactivate
          </Button>
        )}
      </div>
    </div>
  );
}

type SortableCommitmentRowProps = {
  commitment: CommitmentItem;
  onChangeState: (id: string, state: CommitmentItem['state']) => void;
};

export function SortableCommitmentRow({
  commitment,
  onChangeState,
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
      isDragging={isDragging}
      containerProps={{ ref: setNodeRef, style }}
      dragHandleProps={{
        ...attributes,
        ...listeners,
        className: cn('touch-none select-none'),
        style: { touchAction: 'none' },
      }}
    />
  );
}
