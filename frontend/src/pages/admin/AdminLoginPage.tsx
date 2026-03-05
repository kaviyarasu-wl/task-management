import { AdminLoginForm } from '@/features/admin/components/AdminLoginForm';
import { config } from '@/shared/constants/config';

export function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="glass-panel rounded-2xl border border-white/10 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white">{config.appName}</h1>
            <p className="mt-2 text-sm text-gray-400">
              Administration Portal
            </p>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
