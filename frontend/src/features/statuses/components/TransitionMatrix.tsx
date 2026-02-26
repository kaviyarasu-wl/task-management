import { Check, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useStatuses } from '../stores/statusStore';
import { useTransitionMatrixQuery } from '../hooks/useStatuses';
import { StatusIconComponent } from './IconPicker';

export function TransitionMatrix() {
  const statuses = useStatuses();
  const { data: matrix, isLoading } = useTransitionMatrixQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No statuses configured.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left">
              <span className="text-sm text-muted-foreground">From / To</span>
            </th>
            {statuses.map((status) => (
              <th key={status._id} className="p-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <StatusIconComponent
                    icon={status.icon}
                    color={status.color}
                    className="h-4 w-4"
                  />
                  <span className="max-w-[80px] truncate text-xs" title={status.name}>
                    {status.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statuses.map((fromStatus) => (
            <tr key={fromStatus._id} className="border-t">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <StatusIconComponent
                    icon={fromStatus.icon}
                    color={fromStatus.color}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{fromStatus.name}</span>
                </div>
              </td>
              {statuses.map((toStatus) => {
                const isSelf = fromStatus._id === toStatus._id;
                const isAllowed = matrix?.[fromStatus._id]?.includes(toStatus._id);

                return (
                  <td
                    key={toStatus._id}
                    className={cn(
                      'p-2 text-center',
                      isSelf && 'bg-muted/50'
                    )}
                  >
                    {isSelf ? (
                      <span className="text-muted-foreground">-</span>
                    ) : isAllowed ? (
                      <Check className="mx-auto h-4 w-4 text-green-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Check className="h-4 w-4 text-green-600" />
          <span>Allowed</span>
        </div>
        <div className="flex items-center gap-1">
          <X className="h-4 w-4 text-muted-foreground/30" />
          <span>Not allowed</span>
        </div>
      </div>
    </div>
  );
}
