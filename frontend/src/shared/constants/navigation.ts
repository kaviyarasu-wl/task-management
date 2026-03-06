import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  Settings,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from './routes';
import type { UserRole } from '@/shared/types/api.types';

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
}

export const mainNavItems: NavItem[] = [
  {
    labelKey: 'navigation.dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    labelKey: 'navigation.projects',
    href: ROUTES.PROJECTS,
    icon: FolderKanban,
  },
  {
    labelKey: 'navigation.tasks',
    href: ROUTES.TASKS,
    icon: CheckSquare,
  },
  {
    labelKey: 'navigation.calendar',
    href: ROUTES.CALENDAR,
    icon: Calendar,
  },
  {
    labelKey: 'navigation.reports',
    href: ROUTES.REPORTS,
    icon: FileText,
    allowedRoles: ['owner', 'admin'],
  },
  {
    labelKey: 'navigation.team',
    href: ROUTES.TEAM,
    icon: Users,
  },
];

export const bottomNavItems: NavItem[] = [
  {
    labelKey: 'navigation.settings',
    href: ROUTES.SETTINGS,
    icon: Settings,
    allowedRoles: ['owner', 'admin'],
  },
];
