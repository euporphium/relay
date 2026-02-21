import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { PointerType } from '@/hooks/usePointerType';

type UseResponsiveSortableSensorsOptions = {
  pointerType: PointerType;
  pointerDistance?: number;
  touchDelay?: number;
  touchTolerance?: number;
};

export function useResponsiveSortableSensors({
  pointerType,
  pointerDistance = 4,
  touchDelay = 180,
  touchTolerance = 8,
}: UseResponsiveSortableSensorsOptions) {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: pointerDistance },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: touchDelay, tolerance: touchTolerance },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(
    ...(pointerType === 'fine'
      ? [pointerSensor, keyboardSensor]
      : [touchSensor, keyboardSensor]),
  );

  return { pointerType, sensors };
}
