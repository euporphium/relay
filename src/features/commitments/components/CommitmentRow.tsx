import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DotsSixVerticalIcon,
  DotsThreeVerticalIcon,
} from '@phosphor-icons/react';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  if (isActive) {
    return (
      <ActiveCommitmentRow
        commitment={commitment}
        onChangeState={onChangeState}
        onEdit={onEdit}
        containerProps={containerProps}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
        canEdit={canEdit}
      />
    );
  }

  return (
    <CompletedCommitmentRow
      commitment={commitment}
      onChangeState={onChangeState}
      onEdit={onEdit}
      containerProps={containerProps}
      canEdit={canEdit}
    />
  );
}

type BaseRowProps = Pick<
  CommitmentRowProps,
  'commitment' | 'onChangeState' | 'onEdit' | 'containerProps' | 'canEdit'
>;

function ActiveCommitmentRow({
  commitment,
  onChangeState,
  onEdit,
  containerProps,
  dragHandleProps,
  isDragging,
  canEdit = true,
}: BaseRowProps & Pick<CommitmentRowProps, 'dragHandleProps' | 'isDragging'>) {
  return (
    <div
      {...containerProps}
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3 sm:p-4',
        isDragging && 'opacity-70',
        containerProps?.className,
      )}
    >
      {canEdit ? (
        <button
          type="button"
          aria-label="Reorder commitment"
          {...dragHandleProps}
          className={cn(
            '-ml-1 flex shrink-0 select-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation',
            dragHandleProps?.className,
          )}
        >
          <DotsSixVerticalIcon size={18} weight="bold" />
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
          <h3 className="min-w-0 wrap-break-word text-sm font-semibold">
            {commitment.title}
          </h3>

          {canEdit ? (
            <RowActionsMenu
              commitment={commitment}
              onChangeState={onChangeState}
              onEdit={onEdit}
            />
          ) : null}
        </div>

        {commitment.note ? (
          <p className="min-w-0 wrap-break-word text-sm text-muted-foreground">
            {commitment.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CompletedCommitmentRow({
  commitment,
  onChangeState,
  onEdit,
  containerProps,
  canEdit = true,
}: BaseRowProps) {
  const isFulfilled = commitment.state === 'fulfilled';
  const badgeVariant = isFulfilled ? 'success' : 'outline';
  const badgeLabel = isFulfilled ? stateLabels.fulfilled : stateLabels.released;

  return (
    <div
      {...containerProps}
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3 opacity-75 sm:p-4',
        containerProps?.className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
          <h3 className="min-w-0 wrap-break-word text-sm font-semibold line-through">
            {commitment.title}
          </h3>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
            {canEdit ? (
              <RowActionsMenu
                commitment={commitment}
                onChangeState={onChangeState}
                onEdit={onEdit}
              />
            ) : null}
          </div>
        </div>

        {commitment.note ? (
          <p className="min-w-0 wrap-break-word text-sm text-muted-foreground">
            {commitment.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function RowActionsMenu({
  commitment,
  onChangeState,
  onEdit,
}: Pick<CommitmentRowProps, 'commitment' | 'onChangeState' | 'onEdit'>) {
  const isActive = commitment.state === 'active';
  const isFulfilled = commitment.state === 'fulfilled';

  return (
    <div className="flex shrink-0 items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="More actions"
          >
            <DotsThreeVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(commitment.id)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isActive ? (
            <>
              <DropdownMenuItem
                onClick={() => onChangeState(commitment.id, 'fulfilled')}
              >
                Fulfill
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onChangeState(commitment.id, 'released')}
              >
                Release
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => onChangeState(commitment.id, 'active')}
              >
                Reactivate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onChangeState(
                    commitment.id,
                    isFulfilled ? 'released' : 'fulfilled',
                  )
                }
              >
                {isFulfilled ? 'Mark as released' : 'Mark as fulfilled'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
