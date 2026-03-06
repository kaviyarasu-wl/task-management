import { Trash2, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import {
  staggerContainerVariants,
  staggerItemVariants,
} from '@/shared/lib/motion';
import { useUploads } from '../hooks/useUploads';
import { useDeleteUpload } from '../hooks/useUploadMutations';
import { uploadApi } from '../services/uploadApi';
import { FilePreview } from './FilePreview';
import type { UploadEntityType } from '../types/upload.types';

interface FileListProps {
  entityType: UploadEntityType;
  entityId: string;
  canDelete?: boolean;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({
  entityType,
  entityId,
  canDelete = true,
  className,
}: FileListProps) {
  const { data: uploads, isLoading } = useUploads(entityType, entityId);
  const deleteMutation = useDeleteUpload(entityType, entityId);

  const handleDownload = async (uploadId: string) => {
    try {
      const response = await uploadApi.getDownloadUrl(uploadId);
      window.open(response.data.url, '_blank');
    } catch {
      // Error toast handled by interceptor
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <p className={cn('py-4 text-center text-sm text-muted-foreground', className)}>
        No files attached.
      </p>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={cn('space-y-2', className)}
    >
      <AnimatePresence>
        {uploads.map((upload) => (
          <motion.div
            key={upload._id}
            variants={staggerItemVariants}
            exit="exit"
            layout
            className={cn(
              'flex items-center gap-3 rounded-lg border border-border/50 p-3',
              'bg-muted/10 transition-colors hover:bg-muted/20'
            )}
          >
            <FilePreview upload={upload} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {upload.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(upload.size)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => handleDownload(upload._id)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              {canDelete && (
                <button
                  onClick={() => deleteMutation.mutate(upload._id)}
                  disabled={deleteMutation.isPending}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
