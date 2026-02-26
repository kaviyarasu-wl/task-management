import { useState } from 'react';
import { Plus, Filter, Loader2 } from 'lucide-react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/features/projects/hooks/useProjectMutations';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectFormModal } from '@/features/projects/components/ProjectFormModal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { Project } from '@/shared/types/entities.types';
import type { CreateProjectFormData } from '@/features/projects/validators/project.validators';
import { cn } from '@/shared/lib/utils';

export function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useProjects({
    includeArchived: showArchived,
  });

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const projects = data?.pages.flatMap((page) => page.data) ?? [];

  const handleCreate = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleArchive = (project: Project) => {
    updateMutation.mutate({
      projectId: project._id,
      data: { isArchived: !project.isArchived },
    });
  };

  const handleDelete = (project: Project) => {
    setDeletingProject(project);
  };

  const handleFormSubmit = (formData: CreateProjectFormData) => {
    if (editingProject) {
      updateMutation.mutate(
        { projectId: editingProject._id, data: formData },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingProject(null);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingProject) {
      deleteMutation.mutate(deletingProject._id, {
        onSuccess: () => {
          setDeletingProject(null);
        },
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              'flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm',
              showArchived && 'bg-muted'
            )}
          >
            <Filter className="h-4 w-4" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
          <h3 className="font-medium text-foreground">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
          <button
            onClick={handleCreate}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Create Project
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleFormSubmit}
        project={editingProject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
