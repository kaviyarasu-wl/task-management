import {
  LayoutDashboard,
  CreditCard,
  Building2,
  Users,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Plans',
    href: '/admin/plans',
    icon: CreditCard,
  },
  {
    label: 'Tenants',
    href: '/admin/tenants',
    icon: Building2,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
];

export const adminBottomNavItems: AdminNavItem[] = [
  {
    label: 'Back to App',
    href: '/dashboard',
    icon: ArrowLeft,
  },
];
