import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { Button } from './Button';
import {
  backdropVariants,
  scaleVariants,
  springTransition,
} from '@/shared/lib/motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: closeOnEscape ? onClose : undefined,
    autoFocus: true,
    restoreFocus: true,
  });

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-50',
            'flex flex-col',
            'md:flex md:items-center md:justify-center md:p-4'
          )}
          role="presentation"
        >
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            aria-hidden="true"
            onClick={handleOverlayClick}
          />

          {/* Modal Panel */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            className={cn(
              'relative z-50 w-full',
              // Glassmorphism styling
              'bg-background/80 dark:bg-background/70',
              'backdrop-blur-2xl',
              'border border-white/20 dark:border-white/10',
              'shadow-2xl shadow-black/10 dark:shadow-black/30',
              // Mobile: full-screen
              'h-full max-h-screen rounded-none',
              'overflow-y-auto',
              // Desktop: centered dialog
              'md:h-auto md:max-h-[90vh] md:rounded-2xl',
              sizeClasses[size]
            )}
            variants={scaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 md:rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none"
              aria-hidden="true"
            />

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="relative flex items-start justify-between border-b border-border/30 p-4 md:p-6">
                <div className="flex-1 pr-8">
                  {title && (
                    <h2
                      id={titleId}
                      className="text-xl font-semibold text-foreground"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id={descriptionId}
                      className="mt-1.5 text-sm text-muted-foreground"
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={springTransition}
                    className="absolute right-4 top-4"
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full hover:bg-muted/50"
                      onClick={onClose}
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="relative p-4 md:p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'border-t border-border/30',
        'pt-4 -mx-4 -mb-4 px-4 pb-4 mt-4',
        'md:pt-6 md:-mx-6 md:-mb-6 md:px-6 md:pb-6 md:mt-6',
        'bg-muted/20 md:rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export { Modal, ModalFooter };
export type { ModalProps };
