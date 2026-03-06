import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema } from '../task.validators';

describe('createTaskSchema', () => {
  describe('title', () => {
    it('accepts valid title', () => {
      const result = createTaskSchema.safeParse({
        title: 'My Task',
        projectId: 'project-1',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        projectId: 'project-1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('rejects title over 200 characters', () => {
      const result = createTaskSchema.safeParse({
        title: 'a'.repeat(201),
        projectId: 'project-1',
      });
      expect(result.success).toBe(false);
    });

    it('accepts title at exactly 200 characters', () => {
      const result = createTaskSchema.safeParse({
        title: 'a'.repeat(200),
        projectId: 'project-1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('description', () => {
    it('allows empty description', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: 'project-1',
        description: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects description over 2000 characters', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: 'project-1',
        description: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('projectId', () => {
    it('rejects empty projectId', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('priority', () => {
    it('defaults to medium', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: 'project-1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('medium');
      }
    });

    it('accepts valid priorities', () => {
      for (const priority of ['low', 'medium', 'high', 'urgent']) {
        const result = createTaskSchema.safeParse({
          title: 'Task',
          projectId: 'project-1',
          priority,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid priority', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: 'project-1',
        priority: 'critical',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('assigneeId', () => {
    it('accepts null assigneeId', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: 'project-1',
        assigneeId: null,
      });
      expect(result.success).toBe(true);
    });

    it('accepts string assigneeId', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: 'project-1',
        assigneeId: 'user-1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tags', () => {
    it('accepts tags as string', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        projectId: 'project-1',
        tags: 'bug, feature, urgent',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('updateTaskSchema', () => {
  it('allows partial updates', () => {
    const result = updateTaskSchema.safeParse({
      title: 'Updated Title',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty object', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates title when provided', () => {
    const result = updateTaskSchema.safeParse({
      title: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
