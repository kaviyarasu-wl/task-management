import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/features/tasks/hooks/useTaskMutations';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { TaskFilters } from '@/features/tasks/components/TaskFilters';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { TaskBoard } from '@/features/tasks/components/TaskBoard';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { TaskDetailModal } from '@/features/tasks/components/TaskDetailModal';
import { ViewToggle, type ViewMode } from '@/features/tasks/components/ViewToggle';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { Task } from '@/shared/types/entities.types';
import type { TaskStatus, TaskPriority } from '@/shared/types/api.types';
import type { CreateTaskFormData } from '@/features/tasks/validators/task.validators';

export function TasksPage() {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>();
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>();

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  // Data
  const { data: projectsData } = useProjects();
  const projects = projectsData?.pages.flatMap((p) => p.data) ?? [];

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTasks({
    projectId: selectedProjectId,
    status: viewMode === 'board' ? undefined : selectedStatus, // Board shows all statuses
    priority: selectedPriority,
    limit: viewMode === 'board' ? 100 : 20, // Load more for board view
  });

  const tasks = data?.pages.flatMap((p) => p.data) ?? [];

  // Mutations
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const handleCreate = (status: TaskStatus = 'todo') => {
    setEditingTask(null);
    setDefaultStatus(status);
    setIsFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleView = (task: Task) => {
    setViewingTask(task);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateMutation.mutate({ taskId, data: { status } });
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
            ...formData,
            tags,
            dueDate: formData.dueDate || undefined,
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
          ...formData,
          tags,
          status: defaultStatus,
          dueDate: formData.dueDate || undefined,
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

  const clearFilters = () => {
    setSelectedProjectId(undefined);
    setSelectedStatus(undefined);
    setSelectedPriority(undefined);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button
            onClick={() => handleCreate()}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4">
        <TaskFilters
          projects={projects}
          selectedProjectId={selectedProjectId}
          selectedStatus={viewMode === 'list' ? selectedStatus : undefined}
          selectedPriority={selectedPriority}
          onProjectChange={setSelectedProjectId}
          onStatusChange={viewMode === 'list' ? setSelectedStatus : () => {}}
          onPriorityChange={setSelectedPriority}
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
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
    </div>
  );
}
