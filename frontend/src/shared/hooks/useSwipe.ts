import { useEffect, useRef, type RefObject } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe(
  ref: RefObject<HTMLElement | null>,
  options: UseSwipeOptions
): void {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options;
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (event: TouchEvent) => {
      touchStartX.current = event.changedTouches[0].clientX;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      touchEndX.current = event.changedTouches[0].clientX;
      const deltaX = touchEndX.current - touchStartX.current;

      if (Math.abs(deltaX) < threshold) return;

      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, threshold]);
}
