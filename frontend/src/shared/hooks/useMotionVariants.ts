import { useMemo } from 'react';
import type { Variants } from 'framer-motion';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { createReducedMotionVariant } from '@/shared/lib/motion';

/**
 * Returns motion variants that respect prefers-reduced-motion.
 * When reduced motion is preferred, all transforms/scales are removed,
 * leaving only a simple opacity transition.
 */
export function useMotionVariants(variants: Variants): Variants {
  const prefersReducedMotion = usePrefersReducedMotion();

  return useMemo(
    () => (prefersReducedMotion ? createReducedMotionVariant(variants) : variants),
    [prefersReducedMotion, variants]
  );
}
