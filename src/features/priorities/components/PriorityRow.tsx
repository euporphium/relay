import { useSortable } from '@dnd-kit/sortable';
import {
  CheckCircleIcon,
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
import { AttachmentSummary } from '@/features/attachments/components/AttachmentSummary';
import { useSortableRowBindings } from '@/features/priorities/hooks/useSortableRowBindings';
import type { PointerType } from '@/hooks/usePointerType';
import { useSwipeToComplete } from '@/hooks/useSwipeToComplete';
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
  onDelete: (id: string) => void;
  containerProps?: ComponentPropsWithRef<'div'>;
  dragHandleProps?: ComponentPropsWithoutRef<'button'>;
  isDragging?: boolean;
  canEdit?: boolean;
};

export function PriorityRow({
  priority,
  onChangeState,
  onEdit,
  onDelete,
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
        onDelete={onDelete}
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
      onDelete={onDelete}
      containerProps={containerProps}
      canEdit={canEdit}
    />
  );
}

type BaseRowProps = Pick<
  PriorityRowProps,
  | 'priority'
  | 'onChangeState'
  | 'onEdit'
  | 'onDelete'
  | 'containerProps'
  | 'canEdit'
>;

function ActivePriorityRow({
  priority,
  onChangeState,
  onEdit,
  onDelete,
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
              onDelete={onDelete}
            />
          ) : null}
        </div>

        {priority.note ? (
          <p className="min-w-0 wrap-break-word text-sm text-muted-foreground">
            {priority.note}
          </p>
        ) : null}

        <AttachmentSummary attachments={priority.attachments} />
      </div>
    </div>
  );
}

function CompletedPriorityRow({
  priority,
  onChangeState,
  onEdit,
  onDelete,
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
                onDelete={onDelete}
              />
            ) : null}
          </div>
        </div>

        {priority.note ? (
          <p className="min-w-0 wrap-break-word text-sm text-muted-foreground">
            {priority.note}
          </p>
        ) : null}

        <AttachmentSummary attachments={priority.attachments} />
      </div>
    </div>
  );
}

function RowActionsMenu({
  priority,
  onChangeState,
  onEdit,
  onDelete,
}: Pick<PriorityRowProps, 'priority' | 'onChangeState' | 'onEdit' | 'onDelete'>) {
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(priority.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type SortablePriorityRowProps = {
  priority: Priority;
  onChangeState: (id: string, state: Priority['state']) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  pointerType: PointerType;
};

export function SortablePriorityRow({
  priority,
  onChangeState,
  onEdit,
  onDelete,
  pointerType,
}: SortablePriorityRowProps) {
  type ComposableHandler<T> = ((event: T) => void) | Function | undefined;

  const callHandlers = <T,>(
    ...handlers: Array<ComposableHandler<T>>
  ) => {
    if (handlers.every((handler) => !handler)) return undefined;
    return (event: T) => {
      for (const handler of handlers) {
        if (typeof handler === 'function') {
          (handler as (event: T) => void)(event);
        }
      }
    };
  };

  const isCoarsePointer = pointerType === 'coarse';
  const canSwipeToComplete = isCoarsePointer && priority.state === 'active';
  const swipe = useSwipeToComplete({
    enabled: canSwipeToComplete,
    onComplete: () => onChangeState(priority.id, 'completed'),
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: priority.id,
    disabled: swipe.disableSortable,
  });

  const sortableX = transform?.x ?? 0;
  const sortableY = transform?.y ?? 0;
  const composedTransform = `translate3d(${sortableX + swipe.horizontalOffset}px, ${sortableY}px, 0)`;

  // Compose dnd-kit's sortable transform with local horizontal swipe offset so
  // both interactions render from one transform source.
  const style = {
    transform: composedTransform,
    transition: swipe.transitionOverride ?? transition,
  };

  const bindings = useSortableRowBindings({
    pointerType,
    setNodeRef,
    style,
    attributes,
    listeners,
  });

  const coarseContainerProps = isCoarsePointer
    ? {
        ref: setNodeRef,
        style: {
          ...style,
          touchAction: swipe.axisLock === 'horizontal' ? 'none' : 'pan-y',
        },
        className: cn('relative bg-card', isDragging ? 'z-50' : 'z-10'),
        ...attributes,
        ...(swipe.disableSortable ? {} : (listeners ?? {})),
        onPointerDown: callHandlers(
          swipe.disableSortable ? undefined : listeners?.onPointerDown,
          swipe.pointerHandlers.onPointerDown,
        ),
        onPointerMove: callHandlers(
          swipe.disableSortable ? undefined : listeners?.onPointerMove,
          swipe.pointerHandlers.onPointerMove,
        ),
        onPointerUp: callHandlers(
          swipe.disableSortable ? undefined : listeners?.onPointerUp,
          swipe.pointerHandlers.onPointerUp,
        ),
        onPointerCancel: callHandlers(
          swipe.disableSortable ? undefined : listeners?.onPointerCancel,
          swipe.pointerHandlers.onPointerCancel,
        ),
        onLostPointerCapture: callHandlers(
          swipe.disableSortable ? undefined : listeners?.onLostPointerCapture,
          swipe.pointerHandlers.onLostPointerCapture,
        ),
      }
    : undefined;

  const isHorizontalPreview =
    canSwipeToComplete &&
    swipe.axisLock === 'horizontal' &&
    swipe.isInteracting &&
    swipe.horizontalOffset > 0;
  const previewBackgroundClass = isHorizontalPreview
    ? swipe.isCommitPreview
      ? 'bg-success/20'
      : 'bg-success/10'
    : 'bg-transparent';
  const checkPreviewClass = swipe.isCommitPreview
    ? 'text-success opacity-100 dark:text-success'
    : 'text-success/80 opacity-70 dark:text-success/80';
  const containerProps = coarseContainerProps ?? {
    ...bindings.containerProps,
    className: cn(isDragging && 'relative z-50'),
  };

  return (
    <div className="relative rounded-lg">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-lg transition-colors duration-150',
          previewBackgroundClass,
        )}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 z-0 flex items-center"
      >
        {isHorizontalPreview ? (
          <CheckCircleIcon
            size={18}
            weight="bold"
            className={cn('transition-opacity duration-100', checkPreviewClass)}
          />
        ) : null}
      </div>

      <PriorityRow
        priority={priority}
        onChangeState={onChangeState}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
        canEdit
        containerProps={containerProps}
        dragHandleProps={bindings.dragHandleProps}
      />
    </div>
  );
}
