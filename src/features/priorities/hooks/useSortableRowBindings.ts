import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { PointerType } from '@/hooks/usePointerType';
import { cn } from '@/lib/utils';

type SortableRowBindingsOptions = {
  pointerType: PointerType;
  setNodeRef: (node: HTMLElement | null) => void;
  style: { transform: string | undefined; transition: string | undefined };
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
};

export function useSortableRowBindings({
  pointerType,
  setNodeRef,
  style,
  attributes,
  listeners,
}: SortableRowBindingsOptions) {
  // Fine pointer: drag is initiated from an explicit handle.
  if (pointerType === 'fine') {
    return {
      containerProps: {
        ref: setNodeRef,
        style,
      },
      dragHandleProps: {
        ...attributes,
        ...listeners,
        className: cn('select-none touch-none'),
        style: { touchAction: 'none' },
      },
    };
  }

  // Coarse pointer: the full row is draggable after TouchSensor's press delay.
  // Keep vertical scrolling available while idle (`pan-y`).
  return {
    containerProps: {
      ref: setNodeRef,
      style: {
        ...style,
        touchAction: 'pan-y',
      },
      ...attributes,
      ...listeners,
    },
  };
}
