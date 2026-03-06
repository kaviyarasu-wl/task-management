import { TimeEntryService } from '../../src/modules/timeEntry/timeEntry.service';
import { TimeEntryRepository } from '../../src/modules/timeEntry/timeEntry.repository';
import { RequestContext } from '../../src/core/context/RequestContext';
import { EventBus } from '../../src/core/events/EventBus';
import { NotFoundError, AppError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/timeEntry/timeEntry.repository');
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

describe('TimeEntryService', () => {
  let service: TimeEntryService;
  let mockRepo: jest.Mocked<TimeEntryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TimeEntryService();
    mockRepo = (TimeEntryRepository as jest.MockedClass<typeof TimeEntryRepository>)
      .mock.instances[0] as jest.Mocked<TimeEntryRepository>;
  });

  describe('startTimer', () => {
    it('starts a new timer when none active', async () => {
      mockRepo.findActiveByUser.mockResolvedValue(null);
      const entry = { _id: 'te-1', taskId: 'task-1', startedAt: new Date() };
      mockRepo.create.mockResolvedValue(entry as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.startTimer('task-1', 'Working on feature');
        expect(result).toEqual(entry);
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'tenant-1',
            taskId: 'task-1',
            userId: 'user-1',
            description: 'Working on feature',
          })
        );
        expect(EventBus.emit).toHaveBeenCalledWith('timer.started', expect.objectContaining({
          taskId: 'task-1',
          tenantId: 'tenant-1',
        }));
      });
    });

    it('throws error when timer already running', async () => {
      mockRepo.findActiveByUser.mockResolvedValue({ _id: 'te-existing' } as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.startTimer('task-1')).rejects.toThrow(AppError);
        await expect(service.startTimer('task-1')).rejects.toThrow('Timer already running');
      });
    });
  });

  describe('stopTimer', () => {
    it('stops a running timer and calculates duration', async () => {
      const startedAt = new Date(Date.now() - 3600000); // 1 hour ago
      const entry = {
        _id: 'te-1',
        userId: { toString: () => 'user-1' },
        taskId: { toString: () => 'task-1' },
        startedAt,
        endedAt: null,
      };
      mockRepo.findById.mockResolvedValue(entry as never);
      const updated = { ...entry, endedAt: new Date(), durationMinutes: 60 };
      mockRepo.update.mockResolvedValue(updated as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.stopTimer('te-1');
        expect(result.durationMinutes).toBe(60);
        expect(EventBus.emit).toHaveBeenCalledWith('timer.stopped', expect.objectContaining({
          taskId: 'task-1',
          tenantId: 'tenant-1',
        }));
      });
    });

    it('throws NotFoundError when entry not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.stopTimer('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });

    it('throws NotFoundError when entry belongs to different user', async () => {
      const entry = { _id: 'te-1', userId: { toString: () => 'other-user' } };
      mockRepo.findById.mockResolvedValue(entry as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.stopTimer('te-1')).rejects.toThrow(NotFoundError);
      });
    });

    it('throws error when timer already stopped', async () => {
      const entry = {
        _id: 'te-1',
        userId: { toString: () => 'user-1' },
        endedAt: new Date(),
      };
      mockRepo.findById.mockResolvedValue(entry as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.stopTimer('te-1')).rejects.toThrow('Timer already stopped');
      });
    });
  });

  describe('getActiveTimer', () => {
    it('returns active timer for user', async () => {
      const timer = { _id: 'te-1', endedAt: null };
      mockRepo.findActiveByUser.mockResolvedValue(timer as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getActiveTimer();
        expect(result).toEqual(timer);
        expect(mockRepo.findActiveByUser).toHaveBeenCalledWith('tenant-1', 'user-1');
      });
    });

    it('returns null when no active timer', async () => {
      mockRepo.findActiveByUser.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getActiveTimer();
        expect(result).toBeNull();
      });
    });
  });

  describe('createManualEntry', () => {
    it('creates a manual time entry', async () => {
      const data = {
        taskId: 'task-1',
        description: 'Code review',
        startedAt: new Date('2024-01-15T09:00:00Z'),
        endedAt: new Date('2024-01-15T10:00:00Z'),
        durationMinutes: 60,
        billable: true,
      };
      const entry = { _id: 'te-1', ...data };
      mockRepo.create.mockResolvedValue(entry as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.createManualEntry(data);
        expect(result).toEqual(entry);
        expect(EventBus.emit).toHaveBeenCalledWith('timeEntry.created', expect.objectContaining({
          taskId: 'task-1',
          durationMinutes: 60,
        }));
      });
    });
  });

  describe('getTaskTotal', () => {
    it('returns total duration for a task', async () => {
      mockRepo.sumDuration.mockResolvedValue(180);

      await RequestContext.run(mockContext, async () => {
        const total = await service.getTaskTotal('task-1');
        expect(total).toBe(180);
        expect(mockRepo.sumDuration).toHaveBeenCalledWith('tenant-1', { taskId: 'task-1' });
      });
    });
  });

  describe('getUserWeeklyReport', () => {
    it('returns grouped weekly report', async () => {
      const entries = [
        { startedAt: new Date('2024-01-15T09:00:00Z'), durationMinutes: 60 },
        { startedAt: new Date('2024-01-15T14:00:00Z'), durationMinutes: 120 },
        { startedAt: new Date('2024-01-16T10:00:00Z'), durationMinutes: 45 },
      ];
      mockRepo.findByUser.mockResolvedValue(entries as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getUserWeeklyReport();
        expect(result.userId).toBe('user-1');
        expect(result.totalMinutes).toBe(225); // 60 + 120 + 45
        expect(result.byDay.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('allows getting report for another user', async () => {
      mockRepo.findByUser.mockResolvedValue([]);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getUserWeeklyReport('user-2');
        expect(result.userId).toBe('user-2');
        expect(result.totalMinutes).toBe(0);
      });
    });
  });

  describe('update', () => {
    it('allows owner of entry to update', async () => {
      const entry = { _id: 'te-1', userId: { toString: () => 'user-1' }, taskId: { toString: () => 'task-1' } };
      mockRepo.findById.mockResolvedValue(entry as never);
      mockRepo.update.mockResolvedValue({ ...entry, description: 'Updated' } as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.update('te-1', { description: 'Updated' });
        expect(result.description).toBe('Updated');
        expect(EventBus.emit).toHaveBeenCalledWith('timeEntry.updated', expect.objectContaining({
          entryId: 'te-1',
        }));
      });
    });

    it('throws NotFoundError when entry belongs to different user', async () => {
      const entry = { _id: 'te-1', userId: { toString: () => 'other-user' } };
      mockRepo.findById.mockResolvedValue(entry as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.update('te-1', { description: 'X' })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('delete', () => {
    it('soft deletes entry and emits event', async () => {
      const entry = { _id: 'te-1', userId: { toString: () => 'user-1' }, taskId: { toString: () => 'task-1' } };
      mockRepo.findById.mockResolvedValue(entry as never);
      mockRepo.softDelete.mockResolvedValue(true);

      await RequestContext.run(mockContext, async () => {
        await service.delete('te-1');
        expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'te-1');
        expect(EventBus.emit).toHaveBeenCalledWith('timeEntry.deleted', expect.objectContaining({
          entryId: 'te-1',
          deletedBy: 'user-1',
        }));
      });
    });

    it('throws NotFoundError when entry not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('getById', () => {
    it('returns entry with populated fields', async () => {
      const entry = { _id: 'te-1', taskId: 'task-1' };
      mockRepo.findById.mockResolvedValue(entry as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getById('te-1');
        expect(result).toEqual(entry);
        expect(mockRepo.findById).toHaveBeenCalledWith('tenant-1', 'te-1', { populate: ['task', 'user'] });
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });
});
