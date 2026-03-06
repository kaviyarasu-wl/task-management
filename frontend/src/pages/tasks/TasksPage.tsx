import { useState, useMemo, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/features/tasks/hooks/useTaskMutations';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useStatusesQuery, useDefaultStatus } from '@/features/statuses';
import { TaskFilters } from '@/features/tasks/components/TaskFilters';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { TaskBoard } from '@/features/tasks/components/TaskBoard';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { TaskDetailModal } from '@/features/tasks/components/TaskDetailModal';
import { BulkActionBar } from '@/features/tasks/components/BulkActionBar';
import { ViewToggle, type ViewMode } from '@/features/tasks/components/ViewToggle';
import { useSelectionStore } from '@/features/tasks/stores/selectionStore';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ExportDropdown } from '@/shared/components/ExportDropdown';
import { ExportProgressModal } from '@/shared/components/ExportProgressModal';
import { useFilterParams } from '@/shared/hooks/useFilterParams';
import { useExport } from '@/shared/hooks/useExport';
import { SavedViewsDropdown } from '@/features/saved-views/components/SavedViewsDropdown';
import { useSavedViews } from '@/features/saved-views/hooks/useSavedViews';
import type { SavedViewFilters } from '@/features/saved-views/types/savedView.types';
import type { Task } from '@/shared/types/entities.types';
import type { TaskPriority } from '@/shared/types/api.types';
import type { CreateTaskFormData } from '@/features/tasks/validators/task.validators';
import type { RecurrencePattern } from '@/features/tasks/types/recurrence.types';
import { ResponsiveTable } from '@/shared/components/ResponsiveTable';

export function TasksPage() {
  // Export
  const { startExport, isExporting, progress, jobId, format, cancelExport } = useExport();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filters (URL-synced)
  const FILTER_KEYS = ['projectId', 'statusId', 'priority', 'assigneeId'] as const;
  const { filters, setFilter, setFilters, clearFilters, hasActiveFilters } =
    useFilterParams<Record<typeof FILTER_KEYS[number], string | undefined>>(FILTER_KEYS);

  // Apply default saved view on initial load when no URL params are present
  const { data: savedViews = [] } = useSavedViews();
  const [hasAppliedDefault, setHasAppliedDefault] = useState(false);

  useEffect(() => {
    if (!hasAppliedDefault && !hasActiveFilters && savedViews.length > 0) {
      const defaultView = savedViews.find((v) => v.isDefault);
      if (defaultView) {
        setFilters(defaultView.filters);
      }
      setHasAppliedDefault(true);
    }
  }, [savedViews, hasActiveFilters, hasAppliedDefault, setFilters]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [initialStatusId, setInitialStatusId] = useState<string>();

  // Selection
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const selectAll = useSelectionStore((state) => state.selectAll);
  const clearSelection = useSelectionStore((state) => state.clearSelection);

  // Fetch statuses and sync to store (required for dropdown and board)
  useStatusesQuery();

  // Get default status for creating new tasks
  const defaultStatus = useDefaultStatus();

  // Data
  const { data: projectsData } = useProjects();
  const projects = projectsData?.pages.flatMap((p) => p.data) ?? [];

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTasks({
    projectId: filters.projectId,
    statusId: viewMode === 'board' ? undefined : filters.statusId,
    priority: filters.priority as TaskPriority | undefined,
    assigneeId: filters.assigneeId,
    limit: viewMode === 'board' ? 100 : 20,
  });

  const tasks = data?.pages.flatMap((p) => p.data) ?? [];

  // Check if all tasks are selected
  const allSelected = useMemo(() => {
    if (tasks.length === 0) return false;
    return tasks.every((task) => selectedIds.has(task._id));
  }, [tasks, selectedIds]);

  // Mutations
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const handleCreate = (statusId?: string) => {
    setEditingTask(null);
    setInitialStatusId(statusId ?? defaultStatus?._id);
    setIsFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleView = (task: Task) => {
    setViewingTask(task);
  };

  const handleStatusChange = (taskId: string, statusId: string) => {
    updateMutation.mutate({ taskId, data: { statusId } });
  };

  const handleFormSubmit = (formData: CreateTaskFormData) => {
    // Parse tags from comma-separated string
    const tags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (editingTask) {
      updateMutation.mutate(
        {
          taskId: editingTask._id,
          data: {
            title: formData.title,
            description: formData.description,
            statusId: formData.statusId,
            priority: formData.priority,
            tags,
            dueDate: formData.dueDate || undefined,
            assigneeId: formData.assigneeId ?? undefined,
            recurrence: (formData.recurrence as RecurrencePattern) ?? undefined,
          },
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingTask(null);
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          title: formData.title,
          description: formData.description,
          projectId: formData.projectId,
          statusId: formData.statusId ?? initialStatusId,
          priority: formData.priority,
          tags,
          dueDate: formData.dueDate || undefined,
          assigneeId: formData.assigneeId ?? undefined,
          recurrence: formData.recurrence ?? undefined,
        },
        { onSuccess: () => setIsFormOpen(false) }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (deletingTask) {
      deleteMutation.mutate(deletingTask._id, {
        onSuccess: () => setDeletingTask(null),
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header - stack on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <SavedViewsDropdown
            currentFilters={filters as SavedViewFilters}
            onApplyView={(viewFilters) => setFilters(viewFilters)}
          />
          <ExportDropdown
            exportType="tasks"
            filters={{
              projectId: filters.projectId,
              statusId: filters.statusId,
              priority: filters.priority,
            }}
            onExport={startExport}
          />
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button
            onClick={() => handleCreate()}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4">
        <TaskFilters
          projects={projects}
          selectedProjectId={filters.projectId}
          selectedStatusId={viewMode === 'list' ? filters.statusId : undefined}
          selectedPriority={filters.priority as TaskPriority | undefined}
          onProjectChange={(id) => setFilter('projectId', id)}
          onStatusChange={viewMode === 'list' ? (id) => setFilter('statusId', id) : () => {}}
          onPriorityChange={(p) => setFilter('priority', p)}
          onClearAll={clearFilters}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
          <h3 className="font-medium text-foreground">No tasks found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first task to get started.
          </p>
          <button
            onClick={() => handleCreate()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Create Task
          </button>
        </div>
      ) : viewMode === 'board' ? (
        <div className="mt-6 flex-1 overflow-hidden">
          <TaskBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onTaskClick={handleView}
            onAddTask={handleCreate}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-border bg-background">
          <ResponsiveTable>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) {
                        clearSelection();
                      } else {
                        selectAll(tasks.map((t) => t._id));
                      }
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={setDeletingTask}
                  onView={handleView}
                />
              ))}
            </tbody>
          </table>
          </ResponsiveTable>

          {hasNextPage && (
            <div className="border-t border-border p-4 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more tasks'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        task={editingTask}
        projects={projects}
        isLoading={createMutation.isPending || updateMutation.isPending}
        initialStatusId={initialStatusId}
      />

      <TaskDetailModal
        task={viewingTask}
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        onEdit={(task) => {
          setViewingTask(null);
          handleEdit(task);
        }}
      />

      <ConfirmDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Actions */}
      <BulkActionBar />

      {/* Export Progress */}
      <ExportProgressModal
        isOpen={isExporting && !!jobId}
        onClose={() => {}}
        onCancel={cancelExport}
        progress={progress}
        format={format}
      />
    </div>
  );
}
