/**
 * All permissions in the system.
 * Format: resource.action
 * Wildcard: resource.* grants all actions for a resource
 * Super wildcard: * grants everything (owner only)
 */
export const PERMISSIONS = {
  // Tasks
  'tasks.create': 'Create tasks',
  'tasks.read': 'View tasks',
  'tasks.update': 'Edit tasks',
  'tasks.delete': 'Delete tasks',
  'tasks.assign': 'Assign tasks to users',

  // Projects
  'projects.create': 'Create projects',
  'projects.read': 'View projects',
  'projects.update': 'Edit projects',
  'projects.delete': 'Delete projects',
  'projects.archive': 'Archive projects',

  // Members
  'members.read': 'View team members',
  'members.invite': 'Invite new members',
  'members.remove': 'Remove members',
  'members.update-role': 'Change member roles',

  // Settings
  'settings.read': 'View organization settings',
  'settings.update': 'Modify organization settings',

  // Reports
  'reports.read': 'View reports',
  'reports.export': 'Export reports',

  // Webhooks
  'webhooks.manage': 'Manage webhooks',

  // API Keys
  'api-keys.manage': 'Manage API keys',

  // Roles
  'roles.manage': 'Create, edit, and delete roles',

  // Billing
  'billing.manage': 'Manage billing and subscription',

  // Comments
  'comments.create': 'Create comments',
  'comments.read': 'View comments',
  'comments.update': 'Edit own comments',
  'comments.delete': 'Delete comments',

  // Time entries
  'time-entries.create': 'Log time',
  'time-entries.read': 'View time entries',
  'time-entries.update': 'Edit time entries',
  'time-entries.delete': 'Delete time entries',

  // Activity
  'activity.read': 'View activity feed',
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

/**
 * Permission groups for UI display.
 */
export const PERMISSION_GROUPS = [
  {
    name: 'Tasks',
    permissions: [
      'tasks.create',
      'tasks.read',
      'tasks.update',
      'tasks.delete',
      'tasks.assign',
    ] as Permission[],
  },
  {
    name: 'Projects',
    permissions: [
      'projects.create',
      'projects.read',
      'projects.update',
      'projects.delete',
      'projects.archive',
    ] as Permission[],
  },
  {
    name: 'Members',
    permissions: [
      'members.read',
      'members.invite',
      'members.remove',
      'members.update-role',
    ] as Permission[],
  },
  {
    name: 'Comments',
    permissions: [
      'comments.create',
      'comments.read',
      'comments.update',
      'comments.delete',
    ] as Permission[],
  },
  {
    name: 'Time Tracking',
    permissions: [
      'time-entries.create',
      'time-entries.read',
      'time-entries.update',
      'time-entries.delete',
    ] as Permission[],
  },
  {
    name: 'Reports',
    permissions: ['reports.read', 'reports.export'] as Permission[],
  },
  {
    name: 'Settings',
    permissions: ['settings.read', 'settings.update'] as Permission[],
  },
  {
    name: 'Administration',
    permissions: [
      'roles.manage',
      'webhooks.manage',
      'api-keys.manage',
      'billing.manage',
      'activity.read',
    ] as Permission[],
  },
] as const;

/**
 * System role definitions seeded on tenant creation.
 */
export const SYSTEM_ROLES = {
  owner: {
    name: 'Owner',
    slug: 'owner',
    description: 'Full access to all resources',
    permissions: ['*'] as string[], // Wildcard = all permissions
  },
  admin: {
    name: 'Admin',
    slug: 'admin',
    description: 'Manage team, projects, and settings',
    permissions: ALL_PERMISSIONS.filter(
      (p) => !['billing.manage'].includes(p)
    ) as string[],
  },
  member: {
    name: 'Member',
    slug: 'member',
    description: 'Create and manage own tasks and projects',
    permissions: [
      'tasks.create',
      'tasks.read',
      'tasks.update',
      'tasks.assign',
      'projects.read',
      'members.read',
      'comments.create',
      'comments.read',
      'comments.update',
      'time-entries.create',
      'time-entries.read',
      'time-entries.update',
      'reports.read',
      'activity.read',
    ] as string[],
  },
  viewer: {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access',
    permissions: [
      'tasks.read',
      'projects.read',
      'members.read',
      'comments.read',
      'time-entries.read',
      'reports.read',
      'activity.read',
    ] as string[],
  },
};
