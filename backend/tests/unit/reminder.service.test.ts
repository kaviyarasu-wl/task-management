import { ReminderService } from '../../src/modules/reminder/reminder.service';
import { ReminderPreferenceRepository, TaskReminderRepository } from '../../src/modules/reminder/reminder.repository';
import { RequestContext } from '../../src/core/context/RequestContext';

jest.mock('../../src/modules/reminder/reminder.repository');
jest.mock('@modules/task/task.model', () => ({
  Task: { findOne: jest.fn(), find: jest.fn() },
}));
jest.mock('@modules/user/user.model', () => ({
  User: { findById: jest.fn(), find: jest.fn() },
}));
jest.mock('../../src/modules/reminder/reminderPreference.model', () => ({
  ReminderPreference: { find: jest.fn() },
}));
jest.mock('../../src/modules/reminder/taskReminder.model', () => ({
  TaskReminder: {},
}));
jest.mock('../../src/infrastructure/queue/queues', () => ({
  emailQueue: { add: jest.fn().mockResolvedValue(undefined) },
  reminderQueue: { add: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../src/core/events/EventBus', () => ({
  EventBus: { emit: jest.fn().mockResolvedValue(undefined), on: jest.fn() },
}));
jest.mock('../../src/infrastructure/logger', () => ({
  createLogger: () => ({ warn: jest.fn(), error: jest.fn(), info: jest.fn() }),
}));

const mockContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'test@example.com',
  role: 'member' as const,
  requestId: 'req-1',
  locale: 'en',
};

describe('ReminderService', () => {
  let service: ReminderService;
  let mockPrefRepo: jest.Mocked<ReminderPreferenceRepository>;
  let mockTaskReminderRepo: jest.Mocked<TaskReminderRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReminderService();
    mockPrefRepo = (ReminderPreferenceRepository as jest.MockedClass<typeof ReminderPreferenceRepository>)
      .mock.instances[0] as jest.Mocked<ReminderPreferenceRepository>;
    mockTaskReminderRepo = (TaskReminderRepository as jest.MockedClass<typeof TaskReminderRepository>)
      .mock.instances[0] as jest.Mocked<TaskReminderRepository>;
  });

  describe('getPreferences', () => {
    it('returns existing preferences when found', async () => {
      const prefs = {
        defaultReminders: [30, 60],
        overdueReminders: true,
        dailyDigest: true,
        digestTime: '08:00',
        timezone: 'America/New_York',
      };
      mockPrefRepo.findByUser.mockResolvedValue(prefs as never);

      const result = await service.getPreferences('tenant-1', 'user-1');
      expect(result).toEqual(prefs);
    });

    it('returns defaults when no preferences exist', async () => {
      mockPrefRepo.findByUser.mockResolvedValue(null);

      const result = await service.getPreferences('tenant-1', 'user-1');
      expect(result.defaultReminders).toEqual([60, 1440]);
      expect(result.overdueReminders).toBe(true);
      expect(result.dailyDigest).toBe(false);
      expect(result.digestTime).toBe('09:00');
      expect(result.timezone).toBe('UTC');
    });
  });

  describe('getMyPreferences', () => {
    it('uses RequestContext for tenantId and userId', async () => {
      mockPrefRepo.findByUser.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getMyPreferences();
        expect(result.defaultReminders).toEqual([60, 1440]);
        expect(mockPrefRepo.findByUser).toHaveBeenCalledWith('tenant-1', 'user-1');
      });
    });
  });

  describe('updatePreferences', () => {
    it('upserts preferences', async () => {
      const updated = { defaultReminders: [15, 30], overdueReminders: false };
      mockPrefRepo.upsert.mockResolvedValue(updated as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.updatePreferences({
          defaultReminders: [15, 30],
          overdueReminders: false,
        });
        expect(result).toEqual(updated);
        expect(mockPrefRepo.upsert).toHaveBeenCalledWith('tenant-1', 'user-1', {
          defaultReminders: [15, 30],
          overdueReminders: false,
        });
      });
    });
  });

  describe('scheduleForTask', () => {
    it('schedules reminders based on user preferences', async () => {
      const prefs = {
        defaultReminders: [60], // 1 hour before
        overdueReminders: true,
      };
      mockPrefRepo.findByUser.mockResolvedValue(prefs as never);
      mockTaskReminderRepo.deleteByTask.mockResolvedValue(0);
      mockTaskReminderRepo.create.mockResolvedValue({} as never);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
      await service.scheduleForTask('tenant-1', 'task-1', futureDate, 'user-1');

      // Should delete existing and create new ones
      expect(mockTaskReminderRepo.deleteByTask).toHaveBeenCalledWith('task-1');
      // 1 reminder + 1 overdue
      expect(mockTaskReminderRepo.create).toHaveBeenCalledTimes(2);
    });

    it('skips reminders that would be in the past', async () => {
      const prefs = {
        defaultReminders: [60, 1440], // 1 hour, 1 day before
        overdueReminders: false,
      };
      mockPrefRepo.findByUser.mockResolvedValue(prefs as never);
      mockTaskReminderRepo.deleteByTask.mockResolvedValue(0);
      mockTaskReminderRepo.create.mockResolvedValue({} as never);

      // Due in 30 minutes - 1 hour reminder would be in the past
      const soonDate = new Date(Date.now() + 30 * 60 * 1000);
      await service.scheduleForTask('tenant-1', 'task-1', soonDate, 'user-1');

      // Only the overdue-disabled and 1440min reminder is in the past, 60min is too
      // so none should be created
      expect(mockTaskReminderRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('processDueReminders', () => {
    it('returns count of processed reminders', async () => {
      mockTaskReminderRepo.findDue.mockResolvedValue([]);

      const count = await service.processDueReminders();
      expect(count).toBe(0);
    });
  });

  describe('cancelTaskReminders', () => {
    it('deletes all reminders for a task', async () => {
      mockTaskReminderRepo.deleteByTask.mockResolvedValue(3);

      const count = await service.cancelTaskReminders('task-1');
      expect(count).toBe(3);
      expect(mockTaskReminderRepo.deleteByTask).toHaveBeenCalledWith('task-1');
    });
  });
});
