import { RecurrenceService } from '../../src/modules/recurrence/recurrence.service';
import { RecurrenceRepository } from '../../src/modules/recurrence/recurrence.repository';
import { TaskService } from '../../src/modules/task/task.service';
import { Task } from '../../src/modules/task/task.model';
import { RequestContext } from '../../src/core/context/RequestContext';
import { EventBus } from '../../src/core/events/EventBus';
import { NotFoundError, BadRequestError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/recurrence/recurrence.repository');
jest.mock('../../src/modules/task/task.service');
jest.mock('../../src/modules/task/task.model', () => ({
  Task: { findOne: jest.fn().mockReturnValue({ exec: jest.fn() }) },
}));
jest.mock('../../src/core/events/EventBus', () => ({
  EventBus: { emit: jest.fn().mockResolvedValue(undefined), on: jest.fn() },
}));

const mockContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'test@example.com',
  role: 'member' as const,
  requestId: 'req-1',
  locale: 'en',
};

describe('RecurrenceService', () => {
  let service: RecurrenceService;
  let mockRepo: jest.Mocked<RecurrenceRepository>;
  let mockTaskService: jest.Mocked<TaskService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecurrenceService();
    mockRepo = (RecurrenceRepository as jest.MockedClass<typeof RecurrenceRepository>)
      .mock.instances[0] as jest.Mocked<RecurrenceRepository>;
    mockTaskService = (TaskService as jest.MockedClass<typeof TaskService>)
      .mock.instances[0] as jest.Mocked<TaskService>;
  });

  describe('getById', () => {
    it('returns recurrence when found', async () => {
      const recurrence = { _id: 'r1', pattern: { type: 'daily', interval: 1 } };
      mockRepo.findById.mockResolvedValue(recurrence as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getById('r1');
        expect(result).toEqual(recurrence);
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('create', () => {
    it('creates recurrence and emits event', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      mockTaskService.getById.mockResolvedValue(task as never);
      mockRepo.findByTaskTemplateId.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 'r1',
        _id: 'r1',
        pattern: { type: 'daily', interval: 1 },
      } as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.create('task-1', { type: 'daily', interval: 1 });
        expect(result).toBeDefined();
        expect(EventBus.emit).toHaveBeenCalledWith('recurrence.created', expect.objectContaining({
          taskId: 'task-1',
          tenantId: 'tenant-1',
        }));
      });
    });

    it('throws BadRequestError when task already has a recurrence', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      mockTaskService.getById.mockResolvedValue(task as never);
      mockRepo.findByTaskTemplateId.mockResolvedValue({ _id: 'existing' } as never);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create('task-1', { type: 'daily', interval: 1 })
        ).rejects.toThrow(BadRequestError);
      });
    });

    it('throws BadRequestError for invalid interval', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      mockTaskService.getById.mockResolvedValue(task as never);
      mockRepo.findByTaskTemplateId.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create('task-1', { type: 'daily', interval: 0 })
        ).rejects.toThrow(BadRequestError);
      });
    });

    it('throws BadRequestError for interval exceeding 365', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      mockTaskService.getById.mockResolvedValue(task as never);
      mockRepo.findByTaskTemplateId.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create('task-1', { type: 'daily', interval: 400 })
        ).rejects.toThrow(BadRequestError);
      });
    });

    it('throws BadRequestError for invalid day of week', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      mockTaskService.getById.mockResolvedValue(task as never);
      mockRepo.findByTaskTemplateId.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create('task-1', { type: 'weekly', interval: 1, daysOfWeek: [7] })
        ).rejects.toThrow(BadRequestError);
      });
    });

    it('throws BadRequestError for invalid day of month', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      mockTaskService.getById.mockResolvedValue(task as never);
      mockRepo.findByTaskTemplateId.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create('task-1', { type: 'monthly', interval: 1, dayOfMonth: 32 })
        ).rejects.toThrow(BadRequestError);
      });
    });

    it('throws BadRequestError when endDate is before first occurrence', async () => {
      const task = { _id: 'task-1', tenantId: 'tenant-1' };
      mockTaskService.getById.mockResolvedValue(task as never);
      mockRepo.findByTaskTemplateId.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create(
            'task-1',
            { type: 'daily', interval: 1 },
            { endDate: new Date('2020-01-01') }
          )
        ).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe('update', () => {
    it('updates recurrence and emits event', async () => {
      const existing = { _id: 'r1', pattern: { type: 'daily', interval: 1 } };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue({ ...existing, pattern: { type: 'weekly', interval: 1 } } as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.update('r1', { pattern: { type: 'weekly', interval: 1 } });
        expect(result.pattern.type).toBe('weekly');
        expect(EventBus.emit).toHaveBeenCalledWith('recurrence.updated', expect.objectContaining({
          recurrenceId: 'r1',
        }));
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.update('nonexistent', {})).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('delete', () => {
    it('soft deletes and emits event', async () => {
      const existing = { _id: 'r1', taskTemplateId: { toString: () => 'task-1' } };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.softDelete.mockResolvedValue(true);

      await RequestContext.run(mockContext, async () => {
        await service.delete('r1');
        expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'r1');
        expect(EventBus.emit).toHaveBeenCalledWith('recurrence.deleted', expect.objectContaining({
          recurrenceId: 'r1',
          taskId: 'task-1',
        }));
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('deactivate', () => {
    it('deactivates and emits event', async () => {
      const existing = { _id: 'r1' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.deactivate.mockResolvedValue(undefined);

      await RequestContext.run(mockContext, async () => {
        await service.deactivate('r1');
        expect(mockRepo.deactivate).toHaveBeenCalledWith('tenant-1', 'r1');
        expect(EventBus.emit).toHaveBeenCalledWith('recurrence.deactivated', expect.objectContaining({
          recurrenceId: 'r1',
        }));
      });
    });
  });

  describe('calculateNextOccurrence', () => {
    it('calculates daily recurrence', () => {
      const from = new Date('2024-01-15T12:00:00Z');
      const next = service.calculateNextOccurrence({ type: 'daily', interval: 3 }, from);
      expect(next.getDate()).toBe(18); // 15 + 3
    });

    it('calculates weekly recurrence without specific days', () => {
      const from = new Date('2024-01-15T12:00:00Z'); // Monday
      const next = service.calculateNextOccurrence({ type: 'weekly', interval: 2 }, from);
      expect(next.getDate()).toBe(29); // 15 + 14 days
    });

    it('calculates monthly recurrence', () => {
      const from = new Date('2024-01-15T12:00:00Z');
      const next = service.calculateNextOccurrence({ type: 'monthly', interval: 1 }, from);
      expect(next.getMonth()).toBe(1); // February
    });

    it('handles monthly with dayOfMonth exceeding days in month', () => {
      const from = new Date('2024-01-15T12:00:00Z');
      const next = service.calculateNextOccurrence(
        { type: 'monthly', interval: 1, dayOfMonth: 31 },
        from
      );
      // February 2024 has 29 days (leap year)
      expect(next.getDate()).toBe(29);
    });

    it('normalizes to start of day', () => {
      const from = new Date('2024-01-15T15:30:00Z');
      const next = service.calculateNextOccurrence({ type: 'daily', interval: 1 }, from);
      expect(next.getHours()).toBe(0);
      expect(next.getMinutes()).toBe(0);
      expect(next.getSeconds()).toBe(0);
    });
  });

  describe('generateTask', () => {
    it('deactivates recurrence when template task is deleted', async () => {
      const recurrence = {
        _id: 'r1',
        id: 'r1',
        taskTemplateId: 'deleted-task',
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        pattern: { type: 'daily', interval: 1 },
        nextOccurrence: new Date(),
        occurrenceCount: 0,
      };
      (Task.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockRepo.deactivate.mockResolvedValue(undefined);

      await expect(service.generateTask(recurrence as never)).rejects.toThrow(NotFoundError);
      expect(mockRepo.deactivate).toHaveBeenCalledWith('tenant-1', 'r1');
    });
  });
});
