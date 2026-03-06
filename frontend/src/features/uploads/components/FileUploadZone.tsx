import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { fadeVariants } from '@/shared/lib/motion';
import { toast } from '@/shared/stores/toastStore';
import { useUploadFile } from '../hooks/useUploadMutations';
import { UploadProgress } from './UploadProgress';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../validators/upload.validators';
import type { UploadEntityType, Upload as UploadType } from '../types/upload.types';

interface FileUploadZoneProps {
  entityType: UploadEntityType;
  entityId: string;
  acceptedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  compact?: boolean;
  onUploadComplete?: (upload: UploadType) => void;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({
  entityType,
  entityId,
  acceptedTypes = ALLOWED_MIME_TYPES,
  maxFileSize = MAX_FILE_SIZE,
  maxFiles = 5,
  compact = false,
  className,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploadProgress } = useUploadFile(entityType, entityId);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File "${file.name}" exceeds ${formatFileSize(maxFileSize)} limit`;
      }
      if (acceptedTypes.length > 0) {
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.replace('/*', '/'));
          }
          return file.type === type;
        });
        if (!isAccepted) {
          return `File type "${file.type}" is not supported`;
        }
      }
      return null;
    },
    [maxFileSize, acceptedTypes]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles);

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          toast({ type: 'error', title: 'Invalid file', message: validationError });
          continue;
        }
        uploadFile(file);
      }
    },
    [maxFiles, validateFile, uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files by clicking or dragging"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isDragOver
            ? 'scale-[1.01] border-primary bg-primary/5'
            : 'border-border/50 hover:border-primary/50 hover:bg-muted/30',
          compact ? 'p-3' : 'p-6'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3',
            compact ? 'flex-row' : 'flex-col text-center'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-lg',
              'bg-primary/10 text-primary',
              compact ? 'h-8 w-8' : 'h-12 w-12'
            )}
          >
            <Upload className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragOver ? 'Drop files here' : 'Click or drag files to upload'}
            </p>
            {!compact && (
              <p className="mt-1 text-xs text-muted-foreground">
                Max {formatFileSize(maxFileSize)} per file. Up to {maxFiles} files.
              </p>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      <AnimatePresence>
        {uploadProgress.length > 0 && (
          <motion.div
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mt-3 space-y-2"
          >
            {uploadProgress.map((progress) => (
              <UploadProgress key={progress.fileId} progress={progress} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
