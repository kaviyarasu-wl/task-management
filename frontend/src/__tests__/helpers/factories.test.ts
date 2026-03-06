import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUser,
  createTask,
  createProject,
  createTenant,
  createToast,
  resetIdCounter,
} from './factories';

beforeEach(() => {
  resetIdCounter();
});

describe('factories', () => {
  describe('createUser', () => {
    it('creates a user with default values', () => {
      const user = createUser();
      expect(user._id).toBeDefined();
      expect(user.email).toContain('@test.com');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.role).toBe('member');
      expect(user.isEmailVerified).toBe(true);
    });

    it('accepts overrides', () => {
      const user = createUser({ firstName: 'Jane', role: 'admin' });
      expect(user.firstName).toBe('Jane');
      expect(user.role).toBe('admin');
    });

    it('generates unique ids', () => {
      const user1 = createUser();
      const user2 = createUser();
      expect(user1._id).not.toBe(user2._id);
    });
  });

  describe('createTask', () => {
    it('creates a task with default values', () => {
      const task = createTask();
      expect(task._id).toBeDefined();
      expect(task.title).toContain('Task');
      expect(task.priority).toBe('medium');
      expect(task.tags).toEqual([]);
      expect(task.status).toBeDefined();
      expect(task.statusId).toBe('status-1');
    });

    it('accepts overrides', () => {
      const task = createTask({ priority: 'high', title: 'Custom Task' });
      expect(task.priority).toBe('high');
      expect(task.title).toBe('Custom Task');
    });
  });

  describe('createProject', () => {
    it('creates a project with default values', () => {
      const project = createProject();
      expect(project._id).toBeDefined();
      expect(project.name).toContain('Project');
      expect(project.isArchived).toBe(false);
      expect(project.memberIds).toContain('user-1');
    });
  });

  describe('createTenant', () => {
    it('creates a tenant with default values', () => {
      const tenant = createTenant();
      expect(tenant._id).toBeDefined();
      expect(tenant.plan).toBe('free');
      expect(tenant.isActive).toBe(true);
      expect(tenant.settings.maxUsers).toBe(10);
    });
  });

  describe('createToast', () => {
    it('creates a toast with default values', () => {
      const toast = createToast();
      expect(toast.id).toBeDefined();
      expect(toast.type).toBe('success');
      expect(toast.title).toBe('Test Toast');
    });

    it('accepts overrides', () => {
      const toast = createToast({ type: 'error', title: 'Error!' });
      expect(toast.type).toBe('error');
      expect(toast.title).toBe('Error!');
    });
  });
});
