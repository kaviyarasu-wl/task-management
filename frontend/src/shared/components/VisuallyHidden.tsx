import type { ReactNode } from 'react';

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: 'span' | 'div' | 'p';
}

/**
 * Renders content that is visually hidden but accessible to screen readers.
 * Uses the sr-only technique instead of display:none (which hides from AT).
 */
export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}
