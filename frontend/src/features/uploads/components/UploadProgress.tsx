import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { UploadProgress as UploadProgressType } from '../types/upload.types';

interface UploadProgressProps {
  progress: UploadProgressType;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const isError = progress.status === 'error';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2',
        isError
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-border/50 bg-muted/20'
      )}
    >
      {isError ? (
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
      ) : (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{progress.fileName}</p>
        {!isError && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
        {isError && (
          <p className="text-xs text-destructive">{progress.error}</p>
        )}
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        {isError ? 'Failed' : `${progress.progress}%`}
      </span>
    </div>
  );
}
