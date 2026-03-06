import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Loader2, FileDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ExportFormat } from '@/shared/types/export.types';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  progress: number;
  format: ExportFormat | null;
}

function getStatusText(progress: number): string {
  if (progress < 20) return 'Preparing export...';
  if (progress < 50) return 'Generating file...';
  if (progress < 80) return 'Processing data...';
  return 'Almost done...';
}

function getFormatLabel(format: ExportFormat | null): string {
  switch (format) {
    case 'csv':
      return 'CSV';
    case 'pdf':
      return 'PDF';
    case 'excel':
      return 'Excel';
    default:
      return 'File';
  }
}

export function ExportProgressModal({
  isOpen,
  onClose,
  onCancel,
  progress,
  format,
}: ExportProgressModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generating ${getFormatLabel(format)} Export`}
      size="sm"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <FileDown className="absolute h-5 w-5 text-primary" />
        </div>

        <p className="text-sm text-muted-foreground">
          {getStatusText(progress)}
        </p>

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
            <div
              className={cn(
                'h-full rounded-full bg-primary transition-all duration-500 ease-out'
              )}
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
