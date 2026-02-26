import { TaskService } from '../../src/modules/task/task.service';
import { TaskRepository } from '../../src/modules/task/task.repository';
import { RequestContext } from '../../src/core/context/RequestContext';
import { EventBus } from '../../src/core/events/EventBus';
import { NotFoundError, ForbiddenError } from '../../src/core/errors/AppError';

// Mock the repository — tests service logic without hitting DB
jest.mock('../../src/modules/task/task.repository');
jest.mock('../../src/core/events/EventBus', () => ({
  EventBus: { emit: jest.fn(), on: jest.fn() },
}));

const mockContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'test@example.com',
  role: 'member' as const,
  requestId: 'req-1',
};

describe('TaskService', () => {
  let taskService: TaskService;
  let mockRepo: jest.Mocked<TaskRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    taskService = new TaskService();
    mockRepo = (TaskRepository as jest.MockedClass<typeof TaskRepository>).mock.instances[0] as jest.Mocked<TaskRepository>;
  });

  describe('getById', () => {
    it('returns task when found', async () => {
      const mockTask = { _id: 'task-1', title: 'Test task', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(mockTask as never);

      await RequestContext.run(mockContext, async () => {
        const task = await taskService.getById('task-1');
        expect(task).toEqual(mockTask);
        expect(mockRepo.findById).toHaveBeenCalledWith('tenant-1', 'task-1');
      });
    });

    it('throws NotFoundError when task does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(taskService.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('create', () => {
    it('creates task and emits task.created event', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'New task',
        tenantId: 'tenant-1',
        reporterId: 'user-1',
        projectId: 'proj-1',
      };
      mockRepo.create.mockResolvedValue(mockTask as never);

      await RequestContext.run(mockContext, async () => {
        const task = await taskService.create({
          title: 'New task',
          projectId: 'proj-1',
        });

        expect(task).toEqual(mockTask);
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'tenant-1',
            reporterId: 'user-1',
            title: 'New task',
          })
        );
        expect(EventBus.emit).toHaveBeenCalledWith(
          'task.created',
          expect.objectContaining({ taskId: 'task-1', tenantId: 'tenant-1' })
        );
      });
    });
  });

  describe('delete', () => {
    it('throws ForbiddenError when user is not reporter, assignee, or admin', async () => {
      const mockTask = {
        reporterId: 'other-user',
        assigneeId: 'another-user',
        tenantId: 'tenant-1',
      };
      mockRepo.findById.mockResolvedValue(mockTask as never);

      await RequestContext.run(mockContext, async () => {
        await expect(taskService.delete('task-1')).rejects.toThrow(ForbiddenError);
      });
    });

    it('allows reporter to delete their own task', async () => {
      const mockTask = {
        reporterId: 'user-1', // Same as mockContext.userId
        tenantId: 'tenant-1',
      };
      mockRepo.findById.mockResolvedValue(mockTask as never);
      mockRepo.softDelete.mockResolvedValue(true);
      (EventBus.emit as jest.Mock).mockResolvedValue(undefined);

      await RequestContext.run(mockContext, async () => {
        await expect(taskService.delete('task-1')).resolves.not.toThrow();
        expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'task-1');
      });
    });
  });
});
