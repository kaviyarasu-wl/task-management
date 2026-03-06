import { Types } from 'mongoose';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

// Type definitions matching the models
import type { ITenant } from '@modules/tenant/tenant.model';
import type { IUser } from '@modules/user/user.model';
import type { IProject } from '@modules/project/project.model';
import type { ITask } from '@modules/task/task.model';
import type { IStatusDocument } from '@modules/status/status.model';
import type { IInvitation } from '@modules/invitation/invitation.model';
import type { IWebhook } from '@modules/webhook/webhook.model';
import type { IComment } from '@modules/comment/comment.model';
import type { ITimeEntry } from '@modules/timeEntry/timeEntry.model';
import type { IRecurrence } from '@modules/recurrence/recurrence.model';
import type { IApiKey } from '@modules/apiKey/apiKey.model';
import type { UserRole, TenantPlan, TaskPriority, StatusCategory, StatusIcon } from '../../src/types';

let counter = 0;

/**
 * Generates a unique counter to ensure unique test data.
 */
function getUniqueId(): number {
  return ++counter;
}

/**
 * Resets the counter between test runs.
 * Call this in beforeEach() if using unique IDs.
 */
export function resetFactoryCounter(): void {
  counter = 0;
}

/**
 * Creates a partial tenant object for testing.
 */
export function createTenant(overrides: Partial<ITenant> = {}): Partial<ITenant> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId: randomUUID(),
    name: `Test Organization ${id}`,
    slug: `test-org-${id}`,
    plan: 'pro' as TenantPlan,
    ownerId: new Types.ObjectId().toString(),
    settings: {
      maxUsers: 10,
      maxProjects: 20,
      allowedPlugins: [],
    },
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial user object for testing.
 */
export function createUser(
  tenantId: string,
  overrides: Partial<IUser & { password?: string }> = {}
): Partial<IUser> & { password?: string } {
  const id = getUniqueId();
  const password = overrides.password ?? 'TestPassword123!';

  return {
    _id: new Types.ObjectId(),
    tenantId,
    email: `testuser${id}@example.com`,
    passwordHash: bcrypt.hashSync(password, 10),
    firstName: `Test`,
    lastName: `User${id}`,
    role: 'member' as UserRole,
    isEmailVerified: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    password, // Keep plain password for login tests
    ...overrides,
  };
}

/**
 * Creates a partial project object for testing.
 */
export function createProject(
  tenantId: string,
  ownerId: string,
  overrides: Partial<IProject> = {}
): Partial<IProject> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    name: `Test Project ${id}`,
    description: `Description for test project ${id}`,
    ownerId,
    memberIds: [ownerId],
    isArchived: false,
    color: '#4A90D9',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial status object for testing.
 */
export function createStatus(
  tenantId: string,
  overrides: Partial<IStatusDocument> = {}
): Partial<IStatusDocument> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    name: `Status ${id}`,
    slug: `status-${id}`,
    color: '#808080',
    icon: 'circle' as StatusIcon,
    category: 'open' as StatusCategory,
    order: id,
    allowedTransitions: [],
    isDefault: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a set of default statuses for a tenant.
 * Returns [todo, inProgress, done] statuses.
 */
export function createDefaultStatuses(
  tenantId: string
): Partial<IStatusDocument>[] {
  return [
    createStatus(tenantId, {
      name: 'To Do',
      slug: 'to-do',
      color: '#6B7280',
      icon: 'circle',
      category: 'open',
      order: 0,
      isDefault: true,
    }),
    createStatus(tenantId, {
      name: 'In Progress',
      slug: 'in-progress',
      color: '#3B82F6',
      icon: 'loader',
      category: 'in_progress',
      order: 1,
      isDefault: false,
    }),
    createStatus(tenantId, {
      name: 'Done',
      slug: 'done',
      color: '#10B981',
      icon: 'circle-check',
      category: 'closed',
      order: 2,
      isDefault: false,
    }),
  ];
}

/**
 * Creates a partial task object for testing.
 */
export function createTask(
  tenantId: string,
  projectId: string,
  statusId: string | Types.ObjectId,
  reporterId: string,
  overrides: Partial<ITask> = {}
): Partial<ITask> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    title: `Test Task ${id}`,
    description: `Description for test task ${id}`,
    projectId,
    reporterId,
    status: typeof statusId === 'string' ? new Types.ObjectId(statusId) : statusId,
    priority: 'medium' as TaskPriority,
    tags: [],
    attachments: [],
    customFields: new Map(),
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial invitation object for testing.
 */
export function createInvitation(
  tenantId: string,
  invitedBy: string,
  overrides: Partial<IInvitation> = {}
): Partial<IInvitation> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    email: `invited${id}@example.com`,
    role: 'member' as UserRole,
    invitedBy,
    token: randomUUID(),
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial webhook object for testing.
 */
export function createWebhook(
  tenantId: string,
  createdBy: string,
  overrides: Partial<IWebhook> = {}
): Partial<IWebhook> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    name: `Test Webhook ${id}`,
    url: `https://example.com/webhook/${id}`,
    secret: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
    events: ['task.created', 'task.completed'],
    isActive: true,
    failureCount: 0,
    createdBy: new Types.ObjectId(createdBy),
    headers: {},
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial comment object for testing.
 */
export function createComment(
  tenantId: string,
  taskId: string,
  authorId: string,
  overrides: Partial<IComment> = {}
): Partial<IComment> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    taskId,
    authorId,
    content: `Test comment ${id}`,
    mentions: [],
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial time entry object for testing.
 */
export function createTimeEntry(
  tenantId: string,
  taskId: string,
  userId: string,
  overrides: Partial<ITimeEntry> = {}
): Partial<ITimeEntry> {
  const id = getUniqueId();
  const startedAt = new Date(Date.now() - 3600000); // 1 hour ago
  const endedAt = new Date();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    taskId,
    userId,
    description: `Time entry ${id}`,
    startedAt,
    endedAt,
    durationMinutes: 60,
    billable: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial recurrence object for testing.
 */
export function createRecurrence(
  tenantId: string,
  taskTemplateId: string,
  createdBy: string,
  overrides: Partial<IRecurrence> = {}
): Partial<IRecurrence> {
  return {
    _id: new Types.ObjectId(),
    tenantId,
    taskTemplateId,
    pattern: { type: 'daily', interval: 1 },
    nextOccurrence: new Date(Date.now() + 86400000), // tomorrow
    occurrenceCount: 0,
    isActive: true,
    createdBy,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a partial API key object for testing.
 */
export function createApiKey(
  tenantId: string,
  createdBy: string,
  overrides: Partial<IApiKey> = {}
): Partial<IApiKey> {
  const id = getUniqueId();
  return {
    _id: new Types.ObjectId(),
    tenantId,
    name: `Test API Key ${id}`,
    keyHash: bcrypt.hashSync(`tsk_test-key-${id}`, 10),
    keyPrefix: `tsk_testkey${id}`,
    permissions: ['tasks:read', 'tasks:write'] as IApiKey['permissions'],
    isActive: true,
    createdBy,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory object for easy access to all creators.
 */
export const factories = {
  tenant: createTenant,
  user: createUser,
  project: createProject,
  status: createStatus,
  defaultStatuses: createDefaultStatuses,
  task: createTask,
  invitation: createInvitation,
  webhook: createWebhook,
  comment: createComment,
  timeEntry: createTimeEntry,
  recurrence: createRecurrence,
  apiKey: createApiKey,
  reset: resetFactoryCounter,
};
