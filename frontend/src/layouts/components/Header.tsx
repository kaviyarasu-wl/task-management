import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth, useAuthStore } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { cn, getInitials } from '@/shared/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted',
            isDropdownOpen && 'bg-muted'
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user ? getInitials(user.firstName, user.lastName) : '?'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-foreground">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isDropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-background py-1 shadow-lg">
            <Link
              to={ROUTES.PROFILE}
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <hr className="my-1 border-border" />
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
