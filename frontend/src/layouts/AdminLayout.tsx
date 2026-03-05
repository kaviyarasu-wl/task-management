import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { AdminSidebar } from './components/AdminSidebar';
import { ImpersonationBanner } from '@/features/admin/components/ImpersonationBanner';
import { useAuthStore } from '@/features/auth/stores/authStore';

export function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const impersonatedTenant = useAuthStore((state) => state.impersonatedTenant);
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const isCurrentlyImpersonating = isImpersonating();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {isCurrentlyImpersonating && impersonatedTenant && (
        <ImpersonationBanner tenant={impersonatedTenant} />
      )}

      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72',
          isCurrentlyImpersonating && 'pt-12'
        )}
      >
        <main className="flex-1 p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
