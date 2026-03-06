import type { User, Task, Project, Tenant } from '@/shared/types/entities.types';
import type { Toast } from '@/shared/stores/toastStore';

let idCounter = 0;

function nextId(): string {
  idCounter++;
  return `test-id-${idCounter}`;
}

export function resetIdCounter() {
  idCounter = 0;
}

export function createUser(overrides: Partial<User> = {}): User {
  const id = nextId();
  return {
    _id: id,
    email: `user-${id}@test.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'member',
    isEmailVerified: true,
    tenantId: 'tenant-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createTask(overrides: Partial<Task> = {}): Task {
  const id = nextId();
  return {
    _id: id,
    title: `Task ${id}`,
    projectId: 'project-1',
    reporterId: 'user-1',
    status: {
      _id: 'status-1',
      name: 'To Do',
      slug: 'todo',
      category: 'todo',
      color: '#3B82F6',
      order: 0,
      isDefault: true,
      tenantId: 'tenant-1',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    statusId: 'status-1',
    priority: 'medium',
    tags: [],
    tenantId: 'tenant-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createProject(overrides: Partial<Project> = {}): Project {
  const id = nextId();
  return {
    _id: id,
    name: `Project ${id}`,
    ownerId: 'user-1',
    memberIds: ['user-1'],
    isArchived: false,
    tenantId: 'tenant-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createTenant(overrides: Partial<Tenant> = {}): Tenant {
  const id = nextId();
  return {
    _id: id,
    tenantId: `tid-${id}`,
    name: `Org ${id}`,
    slug: `org-${id}`,
    plan: 'free',
    ownerId: 'user-1',
    settings: {
      maxUsers: 10,
      maxProjects: 5,
      allowedPlugins: [],
    },
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createToast(overrides: Partial<Toast> = {}): Toast {
  return {
    id: nextId(),
    type: 'success',
    title: 'Test Toast',
    ...overrides,
  };
}
