import { useMediaQuery } from '@/hooks/useMediaQuery';

export type PointerType = 'fine' | 'coarse';

type UsePointerTypeOptions = {
  desktopQuery?: string;
  finePointerQuery?: string;
  coarsePointerQuery?: string;
};

export function usePointerType({
  desktopQuery = '(min-width: 768px)',
  finePointerQuery = '(hover: hover) and (pointer: fine)',
  coarsePointerQuery = '(pointer: coarse)',
}: UsePointerTypeOptions = {}) {
  const matchesDesktopBreakpoint = useMediaQuery(desktopQuery);
  const hasFinePointer = useMediaQuery(finePointerQuery);
  const hasCoarsePointer = useMediaQuery(coarsePointerQuery);

  const isFinePointer =
    hasFinePointer || (!hasCoarsePointer && matchesDesktopBreakpoint);
  const pointerType: PointerType = isFinePointer ? 'fine' : 'coarse';

  return { pointerType };
}
