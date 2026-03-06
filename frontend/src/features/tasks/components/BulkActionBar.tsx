import { useState } from 'react';
import { X, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import {
  useSelectionStore,
  useSelectedCount,
} from '../stores/selectionStore';
import { useBulkTaskMutations } from '../hooks/useBulkTaskMutations';
import { BulkStatusChange } from './BulkStatusChange';
import { BulkDeleteConfirm } from './BulkDeleteConfirm';
import { cn } from '@/shared/lib/utils';

export function BulkActionBar() {
  const selectedCount = useSelectedCount();
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const { bulkUpdateStatus, bulkDelete } = useBulkTaskMutations();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleStatusChange = async (statusId: string) => {
    const selectedIds = [...useSelectionStore.getState().selectedIds];
    await bulkUpdateStatus.mutateAsync({ taskIds: selectedIds, statusId });
    setShowStatusMenu(false);
    clearSelection();
  };

  const handleDelete = async () => {
    const selectedIds = [...useSelectionStore.getState().selectedIds];
    await bulkDelete.mutateAsync(selectedIds);
    setShowDeleteConfirm(false);
    clearSelection();
  };

  return (
    <>
      <div className={cn(
        'fixed z-50',
        // Mobile: full-width at bottom
        'bottom-0 left-0 right-0',
        // Desktop: floating centered
        'md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2'
      )}>
        <div className={cn(
          'flex items-center gap-2 bg-background/95 backdrop-blur-sm shadow-lg',
          // Mobile: full-width bar
          'px-4 py-3 border-t border-border',
          // Desktop: floating pill
          'md:gap-3 md:rounded-xl md:border md:px-4 md:py-3',
          // Touch-friendly buttons
          '[&_button]:min-h-[44px]'
        )}>
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} task{selectedCount > 1 ? 's' : ''} selected
          </span>

          <div className="h-4 w-px bg-border" />

          {/* Status change */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={bulkUpdateStatus.isPending}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">Move to</span>
              <span className="sm:hidden">Move</span>
            </button>

            {showStatusMenu && (
              <BulkStatusChange
                onSelect={handleStatusChange}
                onClose={() => setShowStatusMenu(false)}
              />
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={bulkDelete.isPending}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {bulkDelete.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Delete</span>
          </button>

          <div className="h-4 w-px bg-border" />

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            className="rounded p-2 hover:bg-muted"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BulkDeleteConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        count={selectedCount}
        isLoading={bulkDelete.isPending}
      />
    </>
  );
}
