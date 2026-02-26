import { cn } from '@/shared/lib/utils';
import {
  Circle,
  CircleDot,
  Loader,
  Clock,
  Eye,
  CheckCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  AlertCircle,
  Archive,
  Flag,
  Star,
  Zap,
} from 'lucide-react';
import type { StatusIcon } from '../types/status.types';

const AVAILABLE_ICONS: StatusIcon[] = [
  'circle',
  'circle-dot',
  'loader',
  'clock',
  'eye',
  'check-circle',
  'check-circle-2',
  'x-circle',
  'pause-circle',
  'alert-circle',
  'archive',
  'flag',
  'star',
  'zap',
];

const ICON_MAP: Record<StatusIcon, React.ComponentType<{ className?: string }>> = {
  'circle': Circle,
  'circle-dot': CircleDot,
  'loader': Loader,
  'clock': Clock,
  'eye': Eye,
  'check-circle': CheckCircle,
  'check-circle-2': CheckCircle2,
  'x-circle': XCircle,
  'pause-circle': PauseCircle,
  'alert-circle': AlertCircle,
  'archive': Archive,
  'flag': Flag,
  'star': Star,
  'zap': Zap,
};

interface IconPickerProps {
  value: StatusIcon;
  onChange: (icon: StatusIcon) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {AVAILABLE_ICONS.map((iconName) => {
        const IconComponent = ICON_MAP[iconName];
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors',
              value === iconName
                ? 'border-primary bg-primary/10'
                : 'border-transparent hover:bg-muted'
            )}
            title={iconName}
          >
            <IconComponent
              className="h-5 w-5"
              style={{ color: color || 'currentColor' }}
            />
          </button>
        );
      })}
    </div>
  );
}

// Helper to render icon by name
export function StatusIconComponent({
  icon,
  color,
  className,
}: {
  icon: StatusIcon;
  color?: string;
  className?: string;
}) {
  const IconComponent = ICON_MAP[icon] || Circle;
  return <IconComponent className={className} style={{ color }} />;
}
