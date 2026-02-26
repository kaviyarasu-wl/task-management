import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mainNavItems, bottomNavItems, type NavItem } from '@/shared/constants/navigation';
import { useAuthStore } from '@/features/auth';
import { cn } from '@/shared/lib/utils';
import { config } from '@/shared/constants/config';

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
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!isCollapsed && (
          <span className="text-lg font-semibold text-foreground">{config.appName}</span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 hover:bg-muted"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col justify-between h-[calc(100vh-4rem)] p-3">
        <ul className="space-y-1">
          {filterByRole(mainNavItems).map((item) => (
            <SidebarNavItem key={item.href} item={item} isCollapsed={isCollapsed} />
          ))}
        </ul>

        {/* Bottom Navigation */}
        <ul className="space-y-1 border-t border-border pt-3">
          {filterByRole(bottomNavItems).map((item) => (
            <SidebarNavItem key={item.href} item={item} isCollapsed={isCollapsed} />
          ))}
        </ul>
      </nav>
    </aside>
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
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-muted hover:text-foreground',
            isActive
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              : 'text-muted-foreground',
            isCollapsed && 'justify-center px-2'
          )
        }
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>{item.label}</span>}
      </NavLink>
    </li>
  );
}
