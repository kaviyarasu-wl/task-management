import type { Variants, Transition } from 'framer-motion';

// ============================================================================
// TRANSITIONS
// ============================================================================

/** Spring transition for interactive elements */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

/** Smooth ease-out transition */
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94],
};

/** Quick transition for micro-interactions */
export const quickTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

/** Slow transition for page elements */
export const slowTransition: Transition = {
  duration: 0.5,
  ease: [0.19, 1, 0.22, 1],
};

// ============================================================================
// PAGE VARIANTS
// ============================================================================

/** Page transition variants for route changes */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

/** Fade variants for simple show/hide */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// MODAL / OVERLAY VARIANTS
// ============================================================================

/** Scale variants for modals and dropdowns */
export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

/** Backdrop blur animation for overlays */
export const backdropVariants: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// SLIDE VARIANTS
// ============================================================================

/** Slide up variants */
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.2 },
  },
};

/** Slide down variants */
export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/** Slide left variants */
export const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2 },
  },
};

/** Slide right variants */
export const slideRightVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// LIST / STAGGER VARIANTS
// ============================================================================

/** Container for staggered children */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/** Fast stagger for lists */
export const staggerFastVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

/** Item within a staggered container */
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: quickTransition,
  },
};

/** Scale item variant for grids */
export const staggerScaleItemVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: quickTransition,
  },
};

// ============================================================================
// INTERACTIVE EFFECTS
// ============================================================================

/** Button tap effect */
export const buttonTapEffect = {
  scale: 0.98,
};

/** Button hover effect */
export const buttonHoverEffect = {
  scale: 1.02,
};

/** Card hover effect with lift */
export const cardHoverEffect = {
  y: -4,
  boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
  transition: springTransition,
};

/** Icon hover effect */
export const iconHoverEffect = {
  scale: 1.1,
  transition: springTransition,
};

/** Link hover effect */
export const linkHoverEffect = {
  x: 2,
  transition: quickTransition,
};

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

/** Pulse animation for notifications */
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.5, 1],
    },
  },
};

/** Shake animation for errors */
export const shakeVariants: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
  },
};

/** Expand/collapse for accordions */
export const expandVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0,
  },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
};

// ============================================================================
// SIDEBAR VARIANTS
// ============================================================================

/** Sidebar expand/collapse */
export const sidebarVariants: Variants = {
  expanded: {
    width: 288,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  collapsed: {
    width: 80,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/** Sidebar text visibility */
export const sidebarTextVariants: Variants = {
  expanded: {
    opacity: 1,
    width: 'auto',
    transition: { delay: 0.1, duration: 0.2 },
  },
  collapsed: {
    opacity: 0,
    width: 0,
    transition: { duration: 0.15 },
  },
};

// ============================================================================
// TOAST / NOTIFICATION VARIANTS
// ============================================================================

/** Toast slide in from right */
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.9,
    transition: quickTransition,
  },
};

// ============================================================================
// LOADING VARIANTS
// ============================================================================

/** Skeleton shimmer effect */
export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/** Spinner rotation */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a delayed variant with custom delay
 */
export function createDelayedVariant(
  baseVariant: Variants,
  delay: number
): Variants {
  return {
    ...baseVariant,
    animate: {
      ...baseVariant.animate,
      transition: {
        ...(typeof baseVariant.animate === 'object' &&
        'transition' in baseVariant.animate
          ? baseVariant.animate.transition
          : {}),
        delay,
      },
    },
  };
}

/**
 * Creates stagger container with custom timing
 */
export function createStaggerContainer(
  staggerDelay = 0.05,
  initialDelay = 0.1
): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };
}
