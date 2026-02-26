export function StatusCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 animate-pulse">
      {/* Drag handle */}
      <div className="h-5 w-5 rounded bg-muted" />

      {/* Icon */}
      <div className="h-10 w-10 rounded-lg bg-muted" />

      {/* Info */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <div className="h-8 w-8 rounded bg-muted" />
        <div className="h-8 w-8 rounded bg-muted" />
      </div>
    </div>
  );
}

interface StatusListSkeletonProps {
  count?: number;
}

export function StatusListSkeleton({ count = 5 }: StatusListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <StatusCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BoardColumnSkeleton() {
  return (
    <div className="flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-4 w-6 rounded-full bg-muted" />
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

interface BoardSkeletonProps {
  columnCount?: number;
}

export function BoardSkeleton({ columnCount = 4 }: BoardSkeletonProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columnCount }).map((_, i) => (
        <BoardColumnSkeleton key={i} />
      ))}
    </div>
  );
}
