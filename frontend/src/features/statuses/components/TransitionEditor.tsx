import { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useStatuses } from '../stores/statusStore';
import { useUpdateTransitions } from '../hooks/useStatusMutations';
import type { Status } from '../types/status.types';
import { StatusIconComponent } from './IconPicker';

interface TransitionEditorProps {
  status: Status;
  onClose?: () => void;
}

export function TransitionEditor({ status, onClose }: TransitionEditorProps) {
  const statuses = useStatuses();
  const updateMutation = useUpdateTransitions();

  // Local state for editing
  const [allowedIds, setAllowedIds] = useState<string[]>(
    status.allowedTransitions || []
  );

  // Other statuses (excluding self)
  const otherStatuses = statuses.filter((s) => s._id !== status._id);

  const toggleTransition = (targetId: string) => {
    setAllowedIds((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId]
    );
  };

  const handleSave = () => {
    updateMutation.mutate(
      { id: status._id, input: { allowedTransitions: allowedIds } },
      { onSuccess: onClose }
    );
  };

  const hasChanges =
    JSON.stringify([...allowedIds].sort()) !==
    JSON.stringify([...(status.allowedTransitions || [])].sort());

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-3">
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
        <div>
          <h3 className="font-medium">{status.name}</h3>
          <p className="text-sm text-muted-foreground">
            Select which statuses tasks can move to
          </p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {otherStatuses.map((targetStatus) => {
          const isAllowed = allowedIds.includes(targetStatus._id);

          return (
            <button
              key={targetStatus._id}
              type="button"
              onClick={() => toggleTransition(targetStatus._id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 transition-colors',
                isAllowed
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent hover:bg-muted'
              )}
            >
              <ArrowRight className="h-4 w-4 text-muted-foreground" />

              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${targetStatus.color}20` }}
              >
                <StatusIconComponent
                  icon={targetStatus.icon}
                  color={targetStatus.color}
                  className="h-4 w-4"
                />
              </div>

              <span className="flex-1 text-left">{targetStatus.name}</span>

              {isAllowed ? (
                <Check className="h-5 w-5 text-primary" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground/30" />
              )}
            </button>
          );
        })}
      </div>

      {otherStatuses.length === 0 && (
        <p className="py-4 text-center text-muted-foreground">
          No other statuses to configure transitions to.
        </p>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Transitions'}
        </button>
      </div>
    </div>
  );
}
