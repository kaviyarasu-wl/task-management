import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  FileArchive,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Upload } from '../types/upload.types';
import { resolveUploadUrl } from '../utils/resolveUploadUrl';

interface FilePreviewProps {
  upload: Upload;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return FileSpreadsheet;
  if (mimeType.includes('zip') || mimeType.includes('archive'))
    return FileArchive;
  return File;
}

const SIZE_MAP = {
  sm: { container: 'h-8 w-8', icon: 'h-4 w-4', image: 'h-8 w-8' },
  md: { container: 'h-10 w-10', icon: 'h-5 w-5', image: 'h-10 w-10' },
  lg: { container: 'h-16 w-16', icon: 'h-8 w-8', image: 'h-16 w-16' },
} as const;

export function FilePreview({ upload, size = 'md', className }: FilePreviewProps) {
  const isImage = upload.mimeType?.startsWith('image/') ?? false;
  const Icon = getFileIcon(upload.mimeType ?? '');
  const sizes = SIZE_MAP[size];

  if (isImage && (upload.thumbnailUrl || upload.url)) {
    return (
      <img
        src={resolveUploadUrl(upload.thumbnailUrl || upload.url)}
        alt={upload.originalName}
        className={cn(
          sizes.image,
          'rounded-md border border-border/50 object-cover',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizes.container,
        'flex items-center justify-center rounded-md',
        'border border-border/50 bg-muted/50',
        className
      )}
    >
      <Icon className={cn(sizes.icon, 'text-muted-foreground')} />
    </div>
  );
}
