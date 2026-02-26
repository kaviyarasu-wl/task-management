import { LayoutList, LayoutGrid } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type ViewMode = 'list' | 'board';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      <button
        onClick={() => onChange('list')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
          value === 'list'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutList className="h-4 w-4" />
        List
      </button>
      <button
        onClick={() => onChange('board')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
          value === 'board'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Board
      </button>
    </div>
  );
}
