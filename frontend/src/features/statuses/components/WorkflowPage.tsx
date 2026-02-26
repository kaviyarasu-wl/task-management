import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useStatuses } from '../stores/statusStore';
import { useStatusesQuery } from '../hooks/useStatuses';
import type { Status } from '../types/status.types';
import { TransitionEditor } from './TransitionEditor';
import { TransitionMatrix } from './TransitionMatrix';
import { StatusIconComponent } from './IconPicker';

export function WorkflowPage() {
  const { isLoading } = useStatusesQuery();
  const statuses = useStatuses();
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Workflow Transitions</h1>
            <p className="text-muted-foreground">
              Define which status transitions are allowed for tasks
            </p>
          </div>
        </div>
      </div>

      {statuses.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No statuses configured. Create statuses first to define workflow transitions.
          </p>
        </div>
      ) : (
        <>
          {/* Matrix overview */}
          <div className="mb-8 rounded-lg border bg-card p-4">
            <h2 className="mb-4 text-lg font-medium">Transition Matrix</h2>
            <TransitionMatrix />
          </div>

          {/* Per-status editor */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium">Configure by Status</h2>
              <p className="text-sm text-muted-foreground">
                Click a status to edit its allowed transitions
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {statuses.map((status) => {
                const isSelected = selectedStatus?._id === status._id;
                const transitionCount = status.allowedTransitions?.length || 0;

                return (
                  <button
                    key={status._id}
                    type="button"
                    onClick={() => setSelectedStatus(isSelected ? null : status)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
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
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{status.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {transitionCount} {transitionCount === 1 ? 'transition' : 'transitions'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedStatus && (
              <div className="mt-4">
                <TransitionEditor
                  key={selectedStatus._id}
                  status={selectedStatus}
                  onClose={() => setSelectedStatus(null)}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
