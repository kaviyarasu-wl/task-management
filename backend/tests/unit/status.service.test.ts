import { StatusService } from '../../src/modules/status/status.service';
import { StatusRepository } from '../../src/modules/status/status.repository';
import { TransitionService } from '../../src/modules/status/transition.service';
import { Task } from '../../src/modules/task/task.model';
import { RequestContext } from '../../src/core/context/RequestContext';
import { EventBus } from '../../src/core/events/EventBus';
import { NotFoundError, ConflictError, ValidationError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/status/status.repository');
jest.mock('../../src/modules/status/transition.service');
jest.mock('../../src/modules/task/task.model', () => ({
  Task: { countDocuments: jest.fn().mockReturnValue({ exec: jest.fn() }) },
}));
jest.mock('../../src/infrastructure/redis/cache', () => ({
  cache: {
    getOrSet: jest.fn((_key: string, fn: () => unknown) => fn()),
    del: jest.fn().mockResolvedValue(true),
  },
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
  email: 'admin@example.com',
  role: 'admin' as const,
  requestId: 'req-1',
  locale: 'en',
};

describe('StatusService', () => {
  let service: StatusService;
  let mockRepo: jest.Mocked<StatusRepository>;
  let mockTransitionService: jest.Mocked<TransitionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StatusService();
    mockRepo = (StatusRepository as jest.MockedClass<typeof StatusRepository>)
      .mock.instances[0] as jest.Mocked<StatusRepository>;
    mockTransitionService = (TransitionService as jest.MockedClass<typeof TransitionService>)
      .mock.instances[0] as jest.Mocked<TransitionService>;
  });

  describe('getAll', () => {
    it('returns all statuses for the tenant', async () => {
      const statuses = [
        { _id: 's1', name: 'To Do', order: 0 },
        { _id: 's2', name: 'Done', order: 1 },
      ];
      mockRepo.findByTenant.mockResolvedValue(statuses as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getAll();
        expect(result).toEqual(statuses);
      });
    });
  });

  describe('getById', () => {
    it('returns status when found', async () => {
      const status = { _id: 's1', name: 'To Do', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(status as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getById('s1');
        expect(result).toEqual(status);
        expect(mockRepo.findById).toHaveBeenCalledWith('s1', 'tenant-1');
      });
    });

    it('throws NotFoundError when status does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('getDefault', () => {
    it('returns the default status', async () => {
      const defaultStatus = { _id: 's1', name: 'To Do', isDefault: true };
      mockRepo.findDefault.mockResolvedValue(defaultStatus as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getDefault();
        expect(result).toEqual(defaultStatus);
      });
    });

    it('falls back to first status when no default is set', async () => {
      const statuses = [{ _id: 's1', name: 'First', order: 0 }];
      mockRepo.findDefault.mockResolvedValue(null);
      mockRepo.findByTenant.mockResolvedValue(statuses as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.getDefault();
        expect(result).toEqual(statuses[0]);
      });
    });

    it('throws NotFoundError when no statuses exist', async () => {
      mockRepo.findDefault.mockResolvedValue(null);
      mockRepo.findByTenant.mockResolvedValue([]);

      await RequestContext.run(mockContext, async () => {
        await expect(service.getDefault()).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('create', () => {
    it('creates a status and emits event', async () => {
      const newStatus = { _id: 's1', name: 'Review', tenantId: 'tenant-1' };
      mockRepo.findByTenant.mockResolvedValue([]); // No existing with same name
      mockRepo.countByTenant.mockResolvedValue(1); // Not first status
      mockRepo.create.mockResolvedValue(newStatus as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.create({ name: 'Review', color: '#FF0000', category: 'in_progress' as const });
        expect(result).toEqual(newStatus);
        expect(EventBus.emit).toHaveBeenCalledWith('status.created', {
          statusId: 's1',
          tenantId: 'tenant-1',
        });
      });
    });

    it('sets as default when it is the first status', async () => {
      mockRepo.findByTenant.mockResolvedValue([]); // No existing
      mockRepo.countByTenant.mockResolvedValue(0); // First status
      mockRepo.create.mockResolvedValue({ _id: 's1', isDefault: true } as never);

      await RequestContext.run(mockContext, async () => {
        await service.create({ name: 'New', color: '#000', category: 'open' as const });
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ isDefault: true })
        );
      });
    });

    it('throws ConflictError when name already exists', async () => {
      const existing = [{ _id: 's1', name: 'Review' }];
      mockRepo.findByTenant.mockResolvedValue(existing as never);

      await RequestContext.run(mockContext, async () => {
        await expect(
          service.create({ name: 'Review', color: '#000', category: 'open' as const })
        ).rejects.toThrow(ConflictError);
      });
    });
  });

  describe('update', () => {
    it('updates status and emits event', async () => {
      const existing = { _id: 's1', name: 'Old', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.findByTenant.mockResolvedValue([existing] as never);
      mockRepo.update.mockResolvedValue({ ...existing, name: 'New' } as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.update('s1', { name: 'New' });
        expect(result.name).toBe('New');
        expect(EventBus.emit).toHaveBeenCalledWith('status.updated', {
          statusId: 's1',
          tenantId: 'tenant-1',
        });
      });
    });

    it('throws NotFoundError when status does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
      });
    });

    it('throws ConflictError when renaming to existing name', async () => {
      const existing = { _id: 's1', name: 'Status A', tenantId: 'tenant-1' };
      const other = { _id: 's2', name: 'Status B' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.findByTenant.mockResolvedValue([existing, other] as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.update('s1', { name: 'Status B' })).rejects.toThrow(ConflictError);
      });
    });
  });

  describe('delete', () => {
    it('soft deletes status and emits event', async () => {
      const status = { _id: 's1', name: 'To Remove', isDefault: false, tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(status as never);
      mockRepo.countByTenant.mockResolvedValue(3);
      (Task.countDocuments as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
      mockTransitionService.removeTransitionReferences.mockResolvedValue(undefined);
      mockRepo.delete.mockResolvedValue(true as never);
      mockRepo.findByTenant.mockResolvedValue([]);
      mockRepo.reorder.mockResolvedValue(undefined);

      await RequestContext.run(mockContext, async () => {
        await service.delete('s1');
        expect(mockRepo.delete).toHaveBeenCalledWith('s1', 'tenant-1');
        expect(EventBus.emit).toHaveBeenCalledWith('status.deleted', {
          statusId: 's1',
          tenantId: 'tenant-1',
        });
      });
    });

    it('throws ConflictError when deleting the only status', async () => {
      const status = { _id: 's1', name: 'Only', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(status as never);
      mockRepo.countByTenant.mockResolvedValue(1);

      await RequestContext.run(mockContext, async () => {
        await expect(service.delete('s1')).rejects.toThrow(ConflictError);
      });
    });

    it('throws ConflictError when tasks reference the status', async () => {
      const status = { _id: 's1', name: 'In Use', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(status as never);
      mockRepo.countByTenant.mockResolvedValue(3);
      (Task.countDocuments as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(5) });

      await RequestContext.run(mockContext, async () => {
        await expect(service.delete('s1')).rejects.toThrow(ConflictError);
      });
    });

    it('throws NotFoundError when status does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });

    it('transfers default to next status when deleting default', async () => {
      const defaultStatus = { _id: 's1', name: 'Default', isDefault: true, tenantId: 'tenant-1' };
      const nextStatus = { _id: 's2', name: 'Next' };
      mockRepo.findById.mockResolvedValue(defaultStatus as never);
      mockRepo.countByTenant.mockResolvedValue(2);
      (Task.countDocuments as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
      mockRepo.findByTenant.mockResolvedValue([defaultStatus, nextStatus] as never);
      mockTransitionService.removeTransitionReferences.mockResolvedValue(undefined);
      mockRepo.delete.mockResolvedValue(true as never);
      mockRepo.update.mockResolvedValue({ ...nextStatus, isDefault: true } as never);
      mockRepo.reorder.mockResolvedValue(undefined);

      await RequestContext.run(mockContext, async () => {
        await service.delete('s1');
        expect(mockRepo.update).toHaveBeenCalledWith('s2', 'tenant-1', { isDefault: true });
      });
    });
  });

  describe('reorder', () => {
    it('reorders statuses and emits event', async () => {
      const statuses = [
        { _id: { toString: () => 'a' }, name: 'A' },
        { _id: { toString: () => 'b' }, name: 'B' },
      ];
      mockRepo.findByTenant.mockResolvedValue(statuses as never);
      mockRepo.reorder.mockResolvedValue(undefined);

      await RequestContext.run(mockContext, async () => {
        await service.reorder(['b', 'a']);
        expect(mockRepo.reorder).toHaveBeenCalledWith('tenant-1', ['b', 'a']);
        expect(EventBus.emit).toHaveBeenCalledWith('status.reordered', {
          tenantId: 'tenant-1',
          statusIds: ['b', 'a'],
        });
      });
    });

    it('throws ValidationError for invalid status IDs', async () => {
      const statuses = [{ _id: { toString: () => 'a' }, name: 'A' }];
      mockRepo.findByTenant.mockResolvedValue(statuses as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.reorder(['a', 'invalid'])).rejects.toThrow(ValidationError);
      });
    });

    it('throws ValidationError for missing status IDs', async () => {
      const statuses = [
        { _id: { toString: () => 'a' }, name: 'A' },
        { _id: { toString: () => 'b' }, name: 'B' },
      ];
      mockRepo.findByTenant.mockResolvedValue(statuses as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.reorder(['a'])).rejects.toThrow(ValidationError);
      });
    });

    it('throws ValidationError for duplicate IDs', async () => {
      const statuses = [
        { _id: { toString: () => 'a' }, name: 'A' },
        { _id: { toString: () => 'b' }, name: 'B' },
      ];
      mockRepo.findByTenant.mockResolvedValue(statuses as never);

      await RequestContext.run(mockContext, async () => {
        await expect(service.reorder(['a', 'a'])).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('setDefault', () => {
    it('sets a status as default and emits event', async () => {
      const status = { _id: 's1', name: 'To Do', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(status as never);
      mockRepo.update.mockResolvedValue({ ...status, isDefault: true } as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.setDefault('s1');
        expect(result.isDefault).toBe(true);
        expect(EventBus.emit).toHaveBeenCalledWith('status.defaultChanged', {
          statusId: 's1',
          tenantId: 'tenant-1',
        });
      });
    });

    it('throws NotFoundError when status does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(service.setDefault('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('setTransitions', () => {
    it('delegates to transition service and emits event', async () => {
      const updated = { _id: 's1', allowedTransitions: ['s2'] };
      mockTransitionService.updateTransitions.mockResolvedValue(updated as never);

      await RequestContext.run(mockContext, async () => {
        const result = await service.setTransitions('s1', ['s2']);
        expect(result).toEqual(updated);
        expect(EventBus.emit).toHaveBeenCalledWith('status.transitionsUpdated', {
          statusId: 's1',
          tenantId: 'tenant-1',
          allowedTransitions: ['s2'],
        });
      });
    });
  });
});
