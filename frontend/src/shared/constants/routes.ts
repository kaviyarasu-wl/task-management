export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  ACCEPT_INVITE: '/invite/:token',

  // App
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:taskId',
  CALENDAR: '/calendar',
  TEAM: '/team',
  SETTINGS: '/settings',
  SETTINGS_STATUSES: '/settings/statuses',
  SETTINGS_WORKFLOW: '/settings/workflow',
  SETTINGS_WEBHOOKS: '/settings/webhooks',
  PROFILE: '/profile',
  REPORTS: '/reports',

  // Admin routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN: '/admin',
  ADMIN_PLANS: '/admin/plans',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_USERS: '/admin/users',
} as const;

export type RouteKey = keyof typeof ROUTES;
