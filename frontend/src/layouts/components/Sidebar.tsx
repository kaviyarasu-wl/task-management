import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  mainNavItems,
  bottomNavItems,
  type NavItem,
} from '@/shared/constants/navigation';
import { useAuthStore } from '@/features/auth';
import { cn } from '@/shared/lib/utils';
import { config } from '@/shared/constants/config';
import {
  sidebarVariants,
  sidebarTextVariants,
  springTransition,
} from '@/shared/lib/motion';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((state) => state.user);

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.allowedRoles) return true;
      return user && item.allowedRoles.includes(user.role);
    });
  };

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        // Glassmorphism styling
        'bg-background/70 dark:bg-background/50',
        'backdrop-blur-xl',
        'border-r border-white/20 dark:border-white/10',
        'shadow-glass'
      )}
      variants={sidebarVariants}
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
    >
      {/* Gradient accent line */}
      <div
        className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-primary/50 via-accent/30 to-transparent"
        aria-hidden="true"
      />

      {/* Subtle inner glow */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative flex h-16 items-center justify-between border-b border-white/10 px-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              className="text-lg font-semibold text-foreground overflow-hidden whitespace-nowrap"
              variants={sidebarTextVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              {config.appName}
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          onClick={onToggle}
          className={cn(
            'rounded-xl p-2',
            'bg-white/10 dark:bg-white/5',
            'border border-white/20 dark:border-white/10',
            'hover:bg-white/20 dark:hover:bg-white/10',
            'transition-colors duration-200'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={springTransition}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="relative flex flex-col justify-between h-[calc(100vh-4rem)] p-3">
        <ul className="space-y-1">
          {filterByRole(mainNavItems).map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>

        <ul className="space-y-1 border-t border-white/10 pt-3">
          {filterByRole(bottomNavItems).map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </nav>
    </motion.aside>
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
}

function SidebarNavItem({ item, isCollapsed }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <li>
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
            'transition-all duration-200',
            isActive
              ? [
                  'bg-primary text-primary-foreground',
                  'shadow-glow-primary',
                ].join(' ')
              : [
                  'text-muted-foreground',
                  'hover:bg-white/10 dark:hover:bg-white/5',
                  'hover:text-foreground',
                ].join(' '),
            isCollapsed && 'justify-center px-2'
          )
        }
        title={isCollapsed ? item.label : undefined}
      >
        {({ isActive }) => (
          <>
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={springTransition}
            >
              <Icon className="h-5 w-5 shrink-0" />
            </motion.div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  variants={sidebarTextVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>
    </li>
  );
}
