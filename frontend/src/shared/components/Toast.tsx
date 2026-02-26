import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Toast as ToastType, ToastType as ToastVariant } from '@/shared/stores/toastStore';
import { cn } from '@/shared/lib/utils';

const TOAST_CONFIG: Record<
  ToastVariant,
  { icon: typeof CheckCircle; className: string }
> = {
  success: { icon: CheckCircle, className: 'bg-green-50 border-green-200 text-green-800' },
  error: { icon: AlertCircle, className: 'bg-red-50 border-red-200 text-red-800' },
  warning: { icon: AlertTriangle, className: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  info: { icon: Info, className: 'bg-blue-50 border-blue-200 text-blue-800' },
};

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        config.className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm opacity-90">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
