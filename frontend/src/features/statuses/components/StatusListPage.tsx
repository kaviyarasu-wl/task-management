import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useStatusesQuery } from '../hooks/useStatuses';
import {
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
  useReorderStatuses,
  useSetDefaultStatus,
} from '../hooks/useStatusMutations';
import type { Status } from '../types/status.types';
import type { CreateStatusFormData } from '../validators/status.validators';
import { StatusCard } from './StatusCard';
import { StatusFormModal } from './StatusFormModal';
import { StatusListSkeleton } from './StatusSkeleton';
import { DeleteStatusDialog } from './DeleteStatusDialog';
import {
  StatusErrorBoundary,
  StatusErrorFallback,
} from './StatusErrorBoundary';
import { toast } from '@/shared/stores/toastStore';

export function StatusListPage() {
  const { data: statuses = [], isLoading, isError, error, refetch } = useStatusesQuery();

  const createMutation = useCreateStatus();
  const updateMutation = useUpdateStatus();
  const deleteMutation = useDeleteStatus();
  const reorderMutation = useReorderStatuses();
  const setDefaultMutation = useSetDefaultStatus();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Status | null>(null);
  const [deleteTaskCount, setDeleteTaskCount] = useState(0);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = statuses.findIndex((s) => s._id === active.id);
    const newIndex = statuses.findIndex((s) => s._id === over.id);

    // Reorder array
    const reordered = [...statuses];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Send to API
    reorderMutation.mutate({
      orderedIds: reordered.map((s) => s._id),
    });
  };

  const handleCreate = () => {
    setEditingStatus(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setIsModalOpen(true);
  };

  const handleDelete = (status: Status) => {
    setDeleteTarget(status);
    setDeleteTaskCount(0);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    setPendingStatusId(deleteTarget._id);
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setPendingStatusId(null);
        toast({
          type: 'success',
          title: 'Status deleted',
          message: `"${deleteTarget.name}" has been removed.`,
        });
      },
      onError: (err: unknown) => {
        setPendingStatusId(null);
        // Check if error indicates tasks are using this status
        const errorResponse = err as { response?: { data?: { taskCount?: number; message?: string } } };
        if (errorResponse.response?.data?.taskCount) {
          setDeleteTaskCount(errorResponse.response.data.taskCount);
        } else {
          toast({
            type: 'error',
            title: 'Failed to delete',
            message: errorResponse.response?.data?.message || 'Could not delete the status.',
          });
        }
      },
    });
  };

  const handleSetDefault = (status: Status) => {
    setPendingStatusId(status._id);
    setDefaultMutation.mutate(status._id, {
      onSuccess: () => {
        setPendingStatusId(null);
        toast({
          type: 'success',
          title: 'Default status updated',
          message: `"${status.name}" is now the default status.`,
        });
      },
      onError: () => {
        setPendingStatusId(null);
        toast({
          type: 'error',
          title: 'Failed to update',
          message: 'Could not set the default status.',
        });
      },
    });
  };

  const handleSubmit = (data: CreateStatusFormData) => {
    if (editingStatus) {
      updateMutation.mutate(
        { id: editingStatus._id, input: data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            toast({
              type: 'success',
              title: 'Status updated',
              message: `"${data.name}" has been saved.`,
            });
          },
          onError: () => {
            toast({
              type: 'error',
              title: 'Failed to update',
              message: 'Could not save the status changes.',
            });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast({
            type: 'success',
            title: 'Status created',
            message: `"${data.name}" has been added.`,
          });
        },
        onError: () => {
          toast({
            type: 'error',
            title: 'Failed to create',
            message: 'Could not create the status.',
          });
        },
      });
    }
  };

  // Show error state
  if (isError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <StatusErrorFallback
          message={(error as Error)?.message || 'Failed to load statuses'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <StatusErrorBoundary>
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Task Statuses</h1>
            <p className="text-muted-foreground">
              Customize statuses and workflow for your team
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Status
          </button>
        </div>

        {isLoading ? (
          <StatusListSkeleton />
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={statuses.map((s) => s._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {statuses.map((status) => (
                    <StatusCard
                      key={status._id}
                      status={status}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onSetDefault={handleSetDefault}
                      isPending={pendingStatusId === status._id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {statuses.length === 0 && (
              <div className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  No statuses yet. Create your first status to get started.
                </p>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create Status
                </button>
              </div>
            )}
          </>
        )}

        <StatusFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          status={editingStatus}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <DeleteStatusDialog
          isOpen={!!deleteTarget}
          status={deleteTarget}
          taskCount={deleteTaskCount}
          isDeleting={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteTaskCount(0);
          }}
        />
      </div>
    </StatusErrorBoundary>
  );
}
