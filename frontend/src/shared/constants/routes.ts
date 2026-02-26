export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',

  // App
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:taskId',
  TEAM: '/team',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

export type RouteKey = keyof typeof ROUTES;
