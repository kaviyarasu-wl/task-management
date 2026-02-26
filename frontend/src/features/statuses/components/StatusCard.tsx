import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Status } from '../types/status.types';
import { StatusIconComponent } from './IconPicker';

interface StatusCardProps {
  status: Status;
  onEdit: (status: Status) => void;
  onDelete: (status: Status) => void;
  onSetDefault: (status: Status) => void;
  isPending?: boolean;
}

const CATEGORY_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
};

export function StatusCard({
  status,
  onEdit,
  onDelete,
  onSetDefault,
  isPending = false,
}: StatusCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-opacity',
        isDragging && 'opacity-50 shadow-lg',
        isPending && 'opacity-60 pointer-events-none'
      )}
    >
      {/* Pending overlay */}
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        disabled={isPending}
        className={cn(
          'cursor-grab text-muted-foreground hover:text-foreground',
          isPending && 'cursor-not-allowed'
        )}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Icon and color preview */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${status.color}20` }}
      >
        <StatusIconComponent
          icon={status.icon}
          color={status.color}
          className="h-5 w-5"
        />
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{status.name}</span>
          {status.isDefault && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Default
            </span>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {CATEGORY_LABELS[status.category]}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!status.isDefault && (
          <button
            onClick={() => onSetDefault(status)}
            disabled={isPending}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            title="Set as default"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onEdit(status)}
          disabled={isPending}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(status)}
          disabled={isPending}
          className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
