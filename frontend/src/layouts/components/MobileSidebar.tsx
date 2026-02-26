import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { mainNavItems, bottomNavItems, type NavItem } from '@/shared/constants/navigation';
import { useAuthStore } from '@/features/auth';
import { cn } from '@/shared/lib/utils';
import { config } from '@/shared/constants/config';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const user = useAuthStore((state) => state.user);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.allowedRoles) return true;
      return user && item.allowedRoles.includes(user.role);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background lg:hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="text-lg font-semibold text-foreground">{config.appName}</span>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col justify-between h-[calc(100vh-4rem)] p-3">
          <ul className="space-y-1">
            {filterByRole(mainNavItems).map((item) => (
              <MobileNavItem key={item.href} item={item} onClose={onClose} />
            ))}
          </ul>

          <ul className="space-y-1 border-t border-border pt-3">
            {filterByRole(bottomNavItems).map((item) => (
              <MobileNavItem key={item.href} item={item} onClose={onClose} />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

interface MobileNavItemProps {
  item: NavItem;
  onClose: () => void;
}

function MobileNavItem({ item, onClose }: MobileNavItemProps) {
  const Icon = item.icon;

  return (
    <li>
      <NavLink
        to={item.href}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-muted hover:text-foreground',
            isActive
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              : 'text-muted-foreground'
          )
        }
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}
