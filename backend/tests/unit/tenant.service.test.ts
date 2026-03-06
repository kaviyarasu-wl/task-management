import { TenantService } from '../../src/modules/tenant/tenant.service';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository';
import { RequestContext } from '../../src/core/context/RequestContext';
import { EventBus } from '../../src/core/events/EventBus';
import { NotFoundError, ForbiddenError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/tenant/tenant.repository');
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

describe('TenantService', () => {
  let service: TenantService;
  let mockRepo: jest.Mocked<TenantRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantService();
    mockRepo = (TenantRepository as jest.MockedClass<typeof TenantRepository>)
      .mock.instances[0] as jest.Mocked<TenantRepository>;
  });

  describe('getMyOrg', () => {
    it('returns the tenant organization', async () => {
      const tenant = { tenantId: 'tenant-1', name: 'Test Org' };
      mockRepo.findById.mockResolvedValue(tenant as never);

      await RequestContext.run(ownerContext, async () => {
        const result = await service.getMyOrg();
        expect(result).toEqual(tenant);
        expect(mockRepo.findById).toHaveBeenCalledWith('tenant-1');
      });
    });

    it('throws NotFoundError when org not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.getMyOrg()).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('updateSettings', () => {
    it('allows owner to update settings', async () => {
      const updated = { tenantId: 'tenant-1', settings: { maxUsers: 50 } };
      mockRepo.updateSettings.mockResolvedValue(updated as never);

      await RequestContext.run(ownerContext, async () => {
        const result = await service.updateSettings({ maxUsers: 50 });
        expect(result).toEqual(updated);
      });
    });

    it('allows admin to update settings', async () => {
      const adminCtx = { ...ownerContext, role: 'admin' as const };
      const updated = { tenantId: 'tenant-1', settings: { maxUsers: 50 } };
      mockRepo.updateSettings.mockResolvedValue(updated as never);

      await RequestContext.run(adminCtx, async () => {
        const result = await service.updateSettings({ maxUsers: 50 });
        expect(result).toEqual(updated);
      });
    });

    it('throws ForbiddenError when member tries to update', async () => {
      await RequestContext.run(memberContext, async () => {
        await expect(service.updateSettings({ maxUsers: 50 })).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when org not found after update', async () => {
      mockRepo.updateSettings.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateSettings({ maxUsers: 50 })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('getMembers', () => {
    it('returns all members of the tenant', async () => {
      const members = [{ _id: 'u1' }, { _id: 'u2' }];
      mockRepo.getUsersInTenant.mockResolvedValue(members as never);

      await RequestContext.run(ownerContext, async () => {
        const result = await service.getMembers();
        expect(result).toEqual(members);
        expect(mockRepo.getUsersInTenant).toHaveBeenCalledWith('tenant-1');
      });
    });
  });

  describe('updateMemberRole', () => {
    it('allows owner to update member role', async () => {
      const updated = { _id: 'user-2', role: 'admin' };
      mockRepo.updateUserRole.mockResolvedValue(updated as never);

      await RequestContext.run(ownerContext, async () => {
        const result = await service.updateMemberRole('user-2', 'admin');
        expect(result.role).toBe('admin');
      });
    });

    it('throws ForbiddenError when member tries to change roles', async () => {
      await RequestContext.run(memberContext, async () => {
        await expect(service.updateMemberRole('user-3', 'admin')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws ForbiddenError when trying to assign owner role', async () => {
      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateMemberRole('user-2', 'owner')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws ForbiddenError when trying to change own role', async () => {
      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateMemberRole('user-1', 'admin')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when target user not found', async () => {
      mockRepo.updateUserRole.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateMemberRole('nonexistent', 'admin')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('removeMember', () => {
    it('removes member and emits user.removed event', async () => {
      mockRepo.removeUser.mockResolvedValue(undefined);

      await RequestContext.run(ownerContext, async () => {
        await service.removeMember('user-2');
        expect(mockRepo.removeUser).toHaveBeenCalledWith('tenant-1', 'user-2');
        expect(EventBus.emit).toHaveBeenCalledWith('user.removed', {
          userId: 'user-2',
          tenantId: 'tenant-1',
          removedBy: 'user-1',
        });
      });
    });

    it('throws ForbiddenError when member tries to remove', async () => {
      await RequestContext.run(memberContext, async () => {
        await expect(service.removeMember('user-3')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws ForbiddenError when trying to remove self', async () => {
      await RequestContext.run(ownerContext, async () => {
        await expect(service.removeMember('user-1')).rejects.toThrow(ForbiddenError);
      });
    });
  });
});
