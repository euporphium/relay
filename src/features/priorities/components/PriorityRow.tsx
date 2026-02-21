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
import { useSortableRowBindings } from '@/features/priorities/hooks/useSortableRowBindings';
import type { PointerType } from '@/hooks/usePointerType';
import { cn } from '@/lib/utils';
import type { Priority } from '@/shared/types/priority';

const stateLabels: Record<Priority['state'], string> = {
  active: 'Active',
  completed: 'Completed',
  released: 'Released',
};

type PriorityRowProps = {
  priority: Priority;
  onChangeState: (id: string, state: Priority['state']) => void;
  onEdit: (id: string) => void;
  containerProps?: ComponentPropsWithRef<'div'>;
  dragHandleProps?: ComponentPropsWithoutRef<'button'>;
  isDragging?: boolean;
  canEdit?: boolean;
};

export function PriorityRow({
  priority,
  onChangeState,
  onEdit,
  containerProps,
  dragHandleProps,
  isDragging,
  canEdit = true,
}: PriorityRowProps) {
  const isActive = priority.state === 'active';

  if (isActive) {
    return (
      <ActivePriorityRow
        priority={priority}
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
    <CompletedPriorityRow
      priority={priority}
      onChangeState={onChangeState}
      onEdit={onEdit}
      containerProps={containerProps}
      canEdit={canEdit}
    />
  );
}

type BaseRowProps = Pick<
  PriorityRowProps,
  'priority' | 'onChangeState' | 'onEdit' | 'containerProps' | 'canEdit'
>;

function ActivePriorityRow({
  priority,
  onChangeState,
  onEdit,
  containerProps,
  dragHandleProps,
  isDragging,
  canEdit = true,
}: BaseRowProps & Pick<PriorityRowProps, 'dragHandleProps' | 'isDragging'>) {
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
          aria-label="Reorder priority"
          {...dragHandleProps}
          className={cn(
            '-ml-1 hidden shrink-0 select-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation [@media(hover:hover)_and_(pointer:fine)]:flex',
            dragHandleProps?.className,
          )}
        >
          <DotsSixVerticalIcon size={18} weight="bold" />
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
          <h3 className="min-w-0 wrap-break-word text-sm font-semibold self-center">
            {priority.title}
          </h3>

          {canEdit ? (
            <RowActionsMenu
              priority={priority}
              onChangeState={onChangeState}
              onEdit={onEdit}
            />
          ) : null}
        </div>

        {priority.note ? (
          <p className="min-w-0 wrap-break-word text-sm text-muted-foreground">
            {priority.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CompletedPriorityRow({
  priority,
  onChangeState,
  onEdit,
  containerProps,
  canEdit = true,
}: BaseRowProps) {
  const isCompleted = priority.state === 'completed';
  const badgeVariant = isCompleted ? 'success' : 'outline';
  const badgeLabel = isCompleted ? stateLabels.completed : stateLabels.released;

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
            {priority.title}
          </h3>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
            {canEdit ? (
              <RowActionsMenu
                priority={priority}
                onChangeState={onChangeState}
                onEdit={onEdit}
              />
            ) : null}
          </div>
        </div>

        {priority.note ? (
          <p className="min-w-0 wrap-break-word text-sm text-muted-foreground">
            {priority.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function RowActionsMenu({
  priority,
  onChangeState,
  onEdit,
}: Pick<PriorityRowProps, 'priority' | 'onChangeState' | 'onEdit'>) {
  const isActive = priority.state === 'active';
  const isCompleted = priority.state === 'completed';

  return (
    <div className="flex shrink-0 items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="More actions"
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <DotsThreeVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(priority.id)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isActive ? (
            <>
              <DropdownMenuItem
                onClick={() => onChangeState(priority.id, 'completed')}
              >
                Complete
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onChangeState(priority.id, 'released')}
              >
                Release
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => onChangeState(priority.id, 'active')}
              >
                Reactivate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onChangeState(
                    priority.id,
                    isCompleted ? 'released' : 'completed',
                  )
                }
              >
                {isCompleted ? 'Mark as released' : 'Mark as completed'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type SortablePriorityRowProps = {
  priority: Priority;
  onChangeState: (id: string, state: Priority['state']) => void;
  onEdit: (id: string) => void;
  pointerType: PointerType;
};

export function SortablePriorityRow({
  priority,
  onChangeState,
  onEdit,
  pointerType,
}: SortablePriorityRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const bindings = useSortableRowBindings({
    pointerType,
    setNodeRef,
    style,
    attributes,
    listeners,
  });

  return (
    <PriorityRow
      priority={priority}
      onChangeState={onChangeState}
      onEdit={onEdit}
      isDragging={isDragging}
      canEdit
      containerProps={bindings.containerProps}
      dragHandleProps={bindings.dragHandleProps}
    />
  );
}
