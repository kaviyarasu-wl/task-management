export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  OAUTH_CALLBACK: '/auth/oauth/callback',
  MFA_VERIFY: '/auth/mfa/verify',
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
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_AUDIT_LOG: '/settings/audit-log',
  SETTINGS_INTEGRATIONS: '/settings/integrations',
  INTEGRATION_OAUTH_CALLBACK: '/settings/integrations/callback',
  PROFILE: '/profile',
  REPORTS: '/reports',
  SEARCH: '/search',

  // Admin routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN: '/admin',
  ADMIN_PLANS: '/admin/plans',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_USERS: '/admin/users',
} as const;

export type RouteKey = keyof typeof ROUTES;
