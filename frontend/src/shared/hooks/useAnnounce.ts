import { useLiveRegion } from '@/shared/components/LiveRegion';

/**
 * Convenience hook for announcing messages to screen readers.
 *
 * Usage:
 *   const { announce } = useAnnounce();
 *   announce('Task created successfully');
 *   announce('Form has 3 errors', 'assertive');
 */
export function useAnnounce() {
  return useLiveRegion();
}
