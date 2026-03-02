import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileSidebar } from './components/MobileSidebar';
import { SkipLink } from '@/shared/components/SkipLink';
import { cn } from '@/shared/lib/utils';
import { pageVariants } from '@/shared/lib/motion';

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated mesh background */}
      <div
        className="fixed inset-0 bg-mesh opacity-60 dark:opacity-30 pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="floating-orb -top-20 -right-20 h-64 w-64 bg-primary/20" />
        <div className="floating-orb -bottom-32 -left-32 h-80 w-80 bg-accent/15 animation-delay-2000" />
        <div className="floating-orb top-1/2 right-1/4 h-40 w-40 bg-blue-400/10 animation-delay-4000" />
      </div>

      <SkipLink />

      {/* Desktop Sidebar */}
      <nav className="hidden lg:block" aria-label="Main navigation">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </nav>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div
        className={cn(
          'relative flex flex-col transition-all duration-300 ease-out',
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        )}
      >
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main id="main-content" className="flex-1 p-4 lg:p-8" tabIndex={-1}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
