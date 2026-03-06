import { useState, useRef, useEffect } from 'react';
import {
  BookmarkPlus,
  ChevronDown,
  Star,
  StarOff,
  Trash2,
  Pencil,
  Users,
  User,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SavedViewFormModal } from './SavedViewFormModal';
import {
  useSavedViews,
  useDeleteSavedView,
  useSetDefaultView,
} from '../hooks/useSavedViews';
import type { SavedView, SavedViewFilters } from '../types/savedView.types';
import { useAuthStore } from '@/features/auth/stores/authStore';

interface SavedViewsDropdownProps {
  currentFilters: SavedViewFilters;
  onApplyView: (filters: SavedViewFilters) => void;
}

export function SavedViewsDropdown({
  currentFilters,
  onApplyView,
}: SavedViewsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: savedViews = [] } = useSavedViews();
  const deleteMutation = useDeleteSavedView();
  const setDefaultMutation = useSetDefaultView();
  const currentUserId = useAuthStore((state) => state.user?._id);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find active view matching current filters
  const activeView = savedViews.find((view) => {
    const f = view.filters;
    return (
      (f.projectId ?? undefined) === (currentFilters.projectId ?? undefined) &&
      (f.statusId ?? undefined) === (currentFilters.statusId ?? undefined) &&
      (f.priority ?? undefined) === (currentFilters.priority ?? undefined) &&
      (f.assigneeId ?? undefined) === (currentFilters.assigneeId ?? undefined)
    );
  });

  const handleSelectView = (view: SavedView) => {
    onApplyView(view.filters);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    onApplyView({});
    setIsOpen(false);
  };

  const handleSaveNew = () => {
    setEditingView(null);
    setIsFormOpen(true);
    setIsOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, view: SavedView) => {
    e.stopPropagation();
    setEditingView(view);
    setIsFormOpen(true);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    deleteMutation.mutate(viewId);
  };

  const handleToggleDefault = (e: React.MouseEvent, view: SavedView) => {
    e.stopPropagation();
    setDefaultMutation.mutate(view.isDefault ? null : view._id);
  };

  const isOwnView = (view: SavedView) => view.createdBy === currentUserId;

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium',
            'hover:bg-muted transition-colors',
            isOpen && 'ring-2 ring-primary/50'
          )}
        >
          {activeView?.name ?? 'All Tasks'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-background shadow-lg">
            <div className="max-h-64 overflow-y-auto p-1">
              {/* All Tasks option */}
              <button
                onClick={handleSelectAll}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                  'hover:bg-muted transition-colors',
                  !activeView && 'bg-primary/5 font-medium text-primary'
                )}
              >
                All Tasks
              </button>

              {/* Saved Views */}
              {savedViews.length > 0 && (
                <>
                  <div className="my-1 border-t border-border" />
                  {savedViews.map((view) => (
                    <div
                      key={view._id}
                      onClick={() => handleSelectView(view)}
                      className={cn(
                        'group flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                        'hover:bg-muted transition-colors',
                        activeView?._id === view._id && 'bg-primary/5 font-medium text-primary'
                      )}
                    >
                      {view.isShared ? (
                        <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 truncate">{view.name}</span>
                      {view.isDefault && (
                        <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
                      )}

                      {/* Actions (visible on hover) */}
                      {isOwnView(view) && (
                        <div className="hidden items-center gap-0.5 group-hover:flex">
                          <button
                            onClick={(e) => handleToggleDefault(e, view)}
                            className="rounded p-1 hover:bg-background"
                            title={view.isDefault ? 'Remove default' : 'Set as default'}
                          >
                            {view.isDefault ? (
                              <StarOff className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Star className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleEdit(e, view)}
                            className="rounded p-1 hover:bg-background"
                            title="Edit view"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, view._id)}
                            className="rounded p-1 hover:bg-background"
                            title="Delete view"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Save current view */}
            <div className="border-t border-border p-1">
              <button
                onClick={handleSaveNew}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <BookmarkPlus className="h-4 w-4" />
                Save current view
              </button>
            </div>
          </div>
        )}
      </div>

      <SavedViewFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingView(null);
        }}
        filters={currentFilters}
        editingView={editingView}
      />
    </>
  );
}
