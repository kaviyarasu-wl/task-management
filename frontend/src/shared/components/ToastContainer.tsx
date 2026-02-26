import { useToastStore } from '@/shared/stores/toastStore';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col items-end gap-2 p-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
