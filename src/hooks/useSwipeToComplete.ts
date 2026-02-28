import type { PointerEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AxisLockMode = 'idle' | 'horizontal' | 'vertical';
type VerticalDirection = 'up' | 'down' | null;

type UseSwipeToCompleteOptions = {
  enabled: boolean;
  onComplete: () => void;
  horizontalActivationPx?: number;
  verticalActivationPx?: number;
  commitRatio?: number;
  maxSwipeRatio?: number;
};

type PointerGestureState = {
  pointerId: number;
  startX: number;
  startY: number;
  rowWidth: number;
  axisOriginX: number;
  axisOriginY: number;
  lastX: number;
  lastY: number;
};

export function useSwipeToComplete({
  enabled,
  onComplete,
  horizontalActivationPx = 18,
  verticalActivationPx = 12,
  commitRatio = 0.3,
  maxSwipeRatio = 0.6,
}: UseSwipeToCompleteOptions) {
  const gestureRef = useRef<PointerGestureState | null>(null);
  const axisLockRef = useRef<AxisLockMode>('idle');
  const switchStreakRef = useRef<{
    target: AxisLockMode | null;
    count: number;
  }>({
    target: null,
    count: 0,
  });
  const hasHapticFiredRef = useRef(false);
  const horizontalOffsetRef = useRef(0);
  const captureTargetRef = useRef<HTMLElement | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [axisLock, setAxisLock] = useState<AxisLockMode>('idle');
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [verticalDirection, setVerticalDirection] =
    useState<VerticalDirection>(null);
  const [isCommitPreview, setIsCommitPreview] = useState(false);
  const [isSnapBackAnimating, setIsSnapBackAnimating] = useState(false);

  useEffect(() => {
    horizontalOffsetRef.current = horizontalOffset;
  }, [horizontalOffset]);

  useEffect(() => {
    axisLockRef.current = axisLock;
  }, [axisLock]);

  useEffect(() => {
    if (!isSnapBackAnimating) return;
    const timeout = setTimeout(() => setIsSnapBackAnimating(false), 200);
    return () => clearTimeout(timeout);
  }, [isSnapBackAnimating]);

  const resetInteractionState = useCallback(() => {
    setIsInteracting(false);
    setAxisLock('idle');
    axisLockRef.current = 'idle';
    setVerticalDirection(null);
    setIsCommitPreview(false);
    gestureRef.current = null;
    switchStreakRef.current = { target: null, count: 0 };
    hasHapticFiredRef.current = false;
  }, []);

  const releasePointerCapture = useCallback((pointerId: number) => {
    const captureTarget = captureTargetRef.current;
    if (
      captureTarget?.releasePointerCapture &&
      captureTarget.hasPointerCapture &&
      captureTarget.hasPointerCapture(pointerId)
    ) {
      try {
        captureTarget.releasePointerCapture(pointerId);
      } catch {
        // No-op: release may fail if the capture was already dropped.
      }
    }
    captureTargetRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || event.pointerType === 'mouse') return;

      captureTargetRef.current = event.currentTarget;
      if (event.currentTarget.setPointerCapture) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Some browsers can throw when capture is unavailable. Continue safely.
        }
      }

      const rowWidth = event.currentTarget.getBoundingClientRect().width;
      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        rowWidth,
        axisOriginX: event.clientX,
        axisOriginY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
      };

      setIsInteracting(true);
      setAxisLock('idle');
      axisLockRef.current = 'idle';
      setHorizontalOffset(0);
      setVerticalDirection(null);
      setIsCommitPreview(false);
      setIsSnapBackAnimating(false);
      switchStreakRef.current = { target: null, count: 0 };
      hasHapticFiredRef.current = false;
    },
    [enabled],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || !gestureRef.current) return;
      if (event.pointerId !== gestureRef.current.pointerId) return;

      const {
        startX,
        startY,
        rowWidth,
        axisOriginX,
        axisOriginY,
        lastX,
        lastY,
      } = gestureRef.current;
      const totalDeltaX = event.clientX - startX;
      const totalDeltaY = event.clientY - startY;
      const totalAbsX = Math.abs(totalDeltaX);
      const totalAbsY = Math.abs(totalDeltaY);
      const lockedDeltaX = event.clientX - axisOriginX;
      const lockedDeltaY = event.clientY - axisOriginY;
      const lockedAbsX = Math.abs(lockedDeltaX);
      const lockedAbsY = Math.abs(lockedDeltaY);
      const stepDeltaX = event.clientX - lastX;
      const stepDeltaY = event.clientY - lastY;
      const stepAbsX = Math.abs(stepDeltaX);
      const stepAbsY = Math.abs(stepDeltaY);

      gestureRef.current = {
        ...gestureRef.current,
        lastX: event.clientX,
        lastY: event.clientY,
      };

      const recordSwitchIntent = (target: AxisLockMode, matches: boolean) => {
        if (!matches) {
          switchStreakRef.current = { target: null, count: 0 };
          return false;
        }

        if (switchStreakRef.current.target === target) {
          switchStreakRef.current = {
            target,
            count: switchStreakRef.current.count + 1,
          };
        } else {
          switchStreakRef.current = { target, count: 1 };
        }

        return switchStreakRef.current.count >= 2;
      };

      let nextAxisLock = axisLockRef.current;

      // Axis lock: choose dominant axis after activation, then allow switching
      // when recent movement shows sustained intent on the opposite axis.
      if (nextAxisLock === 'idle') {
        const crossedHorizontalActivation = totalAbsX >= horizontalActivationPx;
        const crossedVerticalActivation = totalAbsY >= verticalActivationPx;

        if (crossedHorizontalActivation || crossedVerticalActivation) {
          if (totalDeltaX > 0 && totalAbsX > totalAbsY) {
            nextAxisLock = 'horizontal';
            setAxisLock('horizontal');
            axisLockRef.current = 'horizontal';
            switchStreakRef.current = { target: null, count: 0 };
            gestureRef.current = {
              ...gestureRef.current,
              axisOriginX: event.clientX,
              axisOriginY: event.clientY,
            };
          } else if (totalAbsY >= totalAbsX) {
            nextAxisLock = 'vertical';
            setAxisLock('vertical');
            axisLockRef.current = 'vertical';
            switchStreakRef.current = { target: null, count: 0 };
            gestureRef.current = {
              ...gestureRef.current,
              axisOriginX: event.clientX,
              axisOriginY: event.clientY,
            };
          }
        }
      }

      const hasVerticalSwitchIntent =
        nextAxisLock === 'horizontal' &&
        lockedAbsY >= verticalActivationPx / 2 &&
        stepAbsY > stepAbsX + 1;
      const shouldSwitchToVertical = recordSwitchIntent(
        'vertical',
        hasVerticalSwitchIntent,
      );
      if (shouldSwitchToVertical) {
        nextAxisLock = 'vertical';
        setAxisLock('vertical');
        axisLockRef.current = 'vertical';
        switchStreakRef.current = { target: null, count: 0 };
        setHorizontalOffset(0);
        setIsCommitPreview(false);
        gestureRef.current = {
          ...gestureRef.current,
          axisOriginX: event.clientX,
          axisOriginY: event.clientY,
        };
      }

      const hasHorizontalSwitchIntent =
        nextAxisLock === 'vertical' &&
        lockedDeltaX > 0 &&
        lockedAbsX >= horizontalActivationPx / 2 &&
        stepDeltaX > 0 &&
        stepAbsX > stepAbsY + 1;
      const shouldSwitchToHorizontal = recordSwitchIntent(
        'horizontal',
        hasHorizontalSwitchIntent,
      );
      if (shouldSwitchToHorizontal) {
        nextAxisLock = 'horizontal';
        setAxisLock('horizontal');
        axisLockRef.current = 'horizontal';
        switchStreakRef.current = { target: null, count: 0 };
        gestureRef.current = {
          ...gestureRef.current,
          axisOriginX: event.clientX,
          axisOriginY: event.clientY,
        };
      }

      if (nextAxisLock === 'horizontal') {
        event.preventDefault();

        const maxSwipe = rowWidth * maxSwipeRatio;
        const clampedOffset = Math.max(0, Math.min(lockedDeltaX, maxSwipe));
        setHorizontalOffset(clampedOffset);
        setVerticalDirection(null);

        // Thresholds:
        // - activation decides axis lock
        // - commit ratio defines when release will complete.
        const isCommitReady = clampedOffset >= rowWidth * commitRatio;
        setIsCommitPreview(isCommitReady);

        if (
          isCommitReady &&
          !hasHapticFiredRef.current &&
          typeof navigator !== 'undefined' &&
          typeof navigator.vibrate === 'function'
        ) {
          navigator.vibrate(20);
          hasHapticFiredRef.current = true;
        }

        return;
      }

      if (nextAxisLock === 'vertical') {
        setHorizontalOffset(0);
        setIsCommitPreview(false);

        if (lockedDeltaY <= -verticalActivationPx) {
          setVerticalDirection('up');
          return;
        }
        if (lockedDeltaY >= verticalActivationPx) {
          setVerticalDirection('down');
          return;
        }

        setVerticalDirection(null);
      }
    },
    [
      commitRatio,
      enabled,
      horizontalActivationPx,
      maxSwipeRatio,
      verticalActivationPx,
    ],
  );

  const finalizeGesture = useCallback(
    (event?: PointerEvent<HTMLElement>) => {
      if (!enabled) return;

      const activeGesture = gestureRef.current;
      if (!activeGesture) return;
      if (event && event.pointerId !== activeGesture.pointerId) return;

      const didCommit =
        axisLockRef.current === 'horizontal' &&
        horizontalOffsetRef.current >= activeGesture.rowWidth * commitRatio;

      if (didCommit) {
        resetInteractionState();
        setHorizontalOffset(0);
        releasePointerCapture(activeGesture.pointerId);
        onComplete();
        return;
      }

      if (
        axisLockRef.current === 'horizontal' &&
        horizontalOffsetRef.current > 0
      ) {
        setIsSnapBackAnimating(true);
      }

      setHorizontalOffset(0);
      resetInteractionState();
      releasePointerCapture(activeGesture.pointerId);
    },
    [
      commitRatio,
      enabled,
      onComplete,
      releasePointerCapture,
      resetInteractionState,
    ],
  );

  const pointerHandlers = useMemo(
    () =>
      enabled
        ? {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: finalizeGesture,
            onPointerCancel: finalizeGesture,
            onLostPointerCapture: finalizeGesture,
          }
        : {},
    [enabled, finalizeGesture, handlePointerDown, handlePointerMove],
  );

  const transitionOverride = useMemo(() => {
    if (axisLock === 'horizontal' && isInteracting) return 'none';
    if (isSnapBackAnimating) return 'transform 200ms ease-out';
    return undefined;
  }, [axisLock, isInteracting, isSnapBackAnimating]);

  return {
    axisLock,
    horizontalOffset,
    isInteracting,
    isCommitPreview,
    verticalDirection,
    disableSortable: axisLock === 'horizontal',
    transitionOverride,
    pointerHandlers,
  };
}
