import { CommentService } from '../../src/modules/comment/comment.service';
import { CommentRepository } from '../../src/modules/comment/comment.repository';
import { Task } from '../../src/modules/task/task.model';
import { User } from '../../src/modules/user/user.model';
import { RequestContext } from '../../src/core/context/RequestContext';
import { EventBus } from '../../src/core/events/EventBus';
import { NotFoundError, ForbiddenError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/comment/comment.repository');
jest.mock('../../src/modules/task/task.model', () => ({
  Task: { findOne: jest.fn().mockReturnValue({ exec: jest.fn() }) },
}));
jest.mock('../../src/modules/user/user.model', () => ({
  User: { find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn() }) }) },
}));
jest.mock('../../src/core/events/EventBus', () => ({
  EventBus: { emit: jest.fn().mockResolvedValue(undefined), on: jest.fn() },
}));

const ownerContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'owner@example.com',
  role: 'owner' as const,
  requestId: 'req-1',
  locale: 'en',
};

const memberContext = {
  ...ownerContext,
  userId: 'user-2',
  role: 'member' as const,
};

describe('CommentService', () => {
  let service: CommentService;
  let mockRepo: jest.Mocked<CommentRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommentService();
    mockRepo = (CommentRepository as jest.MockedClass<typeof CommentRepository>)
      .mock.instances[0] as jest.Mocked<CommentRepository>;
  });

  describe('getById', () => {
    it('returns comment when found', async () => {
      const comment = { _id: 'c1', content: 'Hello', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(comment as never);

      await RequestContext.run(ownerContext, async () => {
        const result = await service.getById('c1');
        expect(result).toEqual(comment);
      });
    });

    it('throws NotFoundError when comment does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('listByTask', () => {
    it('returns comments for a task', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      (Task.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(task) });

      const result = { data: [{ _id: 'c1' }], total: 1, nextCursor: null };
      mockRepo.findByTask.mockResolvedValue(result as never);

      await RequestContext.run(ownerContext, async () => {
        const comments = await service.listByTask('task-1', {}, { limit: 10 });
        expect(comments).toEqual(result);
      });
    });

    it('throws NotFoundError when task does not exist', async () => {
      (Task.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await RequestContext.run(ownerContext, async () => {
        await expect(service.listByTask('nonexistent', {}, { limit: 10 })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('create', () => {
    it('creates comment and emits event', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      (Task.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(task) });
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });

      const created = { _id: 'c1', content: 'Hello', taskId: 'task-1', authorId: 'user-1' };
      mockRepo.create.mockResolvedValue(created as never);
      mockRepo.findById.mockResolvedValue(created as never);

      await RequestContext.run(ownerContext, async () => {
        const result = await service.create('task-1', { content: 'Hello' });
        expect(result).toEqual(created);
        expect(EventBus.emit).toHaveBeenCalledWith('comment.created', expect.objectContaining({
          commentId: 'c1',
          taskId: 'task-1',
          tenantId: 'tenant-1',
          authorId: 'user-1',
        }));
      });
    });

    it('validates parent comment exists when parentId is provided', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      (Task.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(task) });
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(
          service.create('task-1', { content: 'Reply', parentId: 'nonexistent' })
        ).rejects.toThrow(NotFoundError);
      });
    });

    it('throws ForbiddenError when parent comment belongs to different task', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      (Task.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(task) });

      const parentComment = { _id: 'c-parent', taskId: { toString: () => 'other-task' } };
      mockRepo.findById.mockResolvedValue(parentComment as never);

      await RequestContext.run(ownerContext, async () => {
        await expect(
          service.create('task-1', { content: 'Reply', parentId: 'c-parent' })
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('update', () => {
    it('allows author to update their comment', async () => {
      const existing = { _id: 'c1', authorId: { toString: () => 'user-1' }, taskId: { toString: () => 'task-1' } };
      mockRepo.findById
        .mockResolvedValueOnce(existing as never) // First call: find existing
        .mockResolvedValueOnce(null as never); // extractMentions won't find mentions user
      // Need to also mock for update path
      mockRepo.update.mockResolvedValue({ ...existing, content: 'Updated' } as never);
      mockRepo.findById
        .mockResolvedValueOnce(existing as never) // For the re-read after update
        .mockResolvedValueOnce({ ...existing, content: 'Updated' } as never);

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });

      await RequestContext.run(ownerContext, async () => {
        // Re-setup mocks for a clean path
        mockRepo.findById
          .mockReset()
          .mockResolvedValueOnce(existing as never) // find existing
          .mockResolvedValueOnce({ ...existing, content: 'Updated' } as never); // populated result
        mockRepo.update.mockResolvedValue({ ...existing, content: 'Updated' } as never);

        const result = await service.update('c1', { content: 'Updated' });
        expect(result.content).toBe('Updated');
        expect(EventBus.emit).toHaveBeenCalledWith('comment.updated', expect.objectContaining({
          commentId: 'c1',
        }));
      });
    });

    it('allows admin to update any comment', async () => {
      const existing = { _id: 'c1', authorId: { toString: () => 'other-user' }, taskId: { toString: () => 'task-1' } };
      mockRepo.findById
        .mockResolvedValueOnce(existing as never)
        .mockResolvedValueOnce({ ...existing, content: 'Admin edit' } as never);
      mockRepo.update.mockResolvedValue({ ...existing, content: 'Admin edit' } as never);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });

      await RequestContext.run(ownerContext, async () => {
        const result = await service.update('c1', { content: 'Admin edit' });
        expect(result.content).toBe('Admin edit');
      });
    });

    it('throws ForbiddenError when non-author member tries to update', async () => {
      const existing = { _id: 'c1', authorId: { toString: () => 'other-user' } };
      mockRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.update('c1', { content: 'X' })).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when comment does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.update('nonexistent', { content: 'X' })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('delete', () => {
    it('allows author to delete their comment', async () => {
      const existing = { _id: 'c1', authorId: { toString: () => 'user-1' }, taskId: { toString: () => 'task-1' } };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.softDelete.mockResolvedValue(true);

      await RequestContext.run(ownerContext, async () => {
        await service.delete('c1');
        expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'c1');
        expect(EventBus.emit).toHaveBeenCalledWith('comment.deleted', expect.objectContaining({
          commentId: 'c1',
          tenantId: 'tenant-1',
        }));
      });
    });

    it('throws ForbiddenError when non-author member tries to delete', async () => {
      const existing = { _id: 'c1', authorId: { toString: () => 'other-user' } };
      mockRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.delete('c1')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when comment does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('addAttachment', () => {
    it('throws NotFoundError when comment does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(
          service.addAttachment('nonexistent', {
            uploadId: '507f1f77bcf86cd799439011',
            filename: 'test.png',
            url: '/uploads/test.png',
            mimetype: 'image/png',
            size: 1024,
          })
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});
