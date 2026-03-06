import { UserService } from '../../src/modules/user/user.service';
import { User } from '../../src/modules/user/user.model';
import { RequestContext } from '../../src/core/context/RequestContext';
import { NotFoundError, ForbiddenError, ConflictError, UnauthorizedError } from '../../src/core/errors/AppError';
import bcrypt from 'bcryptjs';

const mockRedis = { del: jest.fn().mockResolvedValue(1) };

jest.mock('../../src/modules/user/user.model', () => ({
  User: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
  },
}));
jest.mock('../../src/infrastructure/redis/client', () => ({
  getRedisClient: () => mockRedis,
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

function mockExec(value: unknown) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function mockSelectExec(value: unknown) {
  return { select: jest.fn().mockReturnValue(mockExec(value)) };
}

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
  });

  describe('getMyProfile', () => {
    it('returns the current user profile', async () => {
      const user = { _id: 'user-1', email: 'owner@example.com', firstName: 'Test' };
      (User.findOne as jest.Mock).mockReturnValue(mockExec(user));

      await RequestContext.run(ownerContext, async () => {
        const result = await service.getMyProfile();
        expect(result).toEqual(user);
        expect(User.findOne).toHaveBeenCalledWith({ _id: 'user-1', tenantId: 'tenant-1' });
      });
    });

    it('throws NotFoundError when user not found', async () => {
      (User.findOne as jest.Mock).mockReturnValue(mockExec(null));

      await RequestContext.run(ownerContext, async () => {
        await expect(service.getMyProfile()).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('getProfile', () => {
    it('returns profile for another user in the same tenant', async () => {
      const user = { _id: 'user-2', email: 'member@example.com' };
      (User.findOne as jest.Mock).mockReturnValue(mockExec(user));

      await RequestContext.run(ownerContext, async () => {
        const result = await service.getProfile('user-2');
        expect(result).toEqual(user);
        expect(User.findOne).toHaveBeenCalledWith({ _id: 'user-2', tenantId: 'tenant-1' });
      });
    });

    it('throws NotFoundError when target user not found', async () => {
      (User.findOne as jest.Mock).mockReturnValue(mockExec(null));

      await RequestContext.run(ownerContext, async () => {
        await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('listByTenant', () => {
    it('returns all users for the tenant', async () => {
      const users = [{ _id: 'user-1' }, { _id: 'user-2' }];
      (User.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(mockExec(users)) });

      await RequestContext.run(ownerContext, async () => {
        const result = await service.listByTenant();
        expect(result).toEqual(users);
      });
    });

    it('filters by role when specified', async () => {
      const admins = [{ _id: 'user-1', role: 'admin' }];
      (User.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(mockExec(admins)) });

      await RequestContext.run(ownerContext, async () => {
        await service.listByTenant({ role: 'admin' });
        expect(User.find).toHaveBeenCalledWith({ tenantId: 'tenant-1', role: 'admin' });
      });
    });
  });

  describe('updateMyProfile', () => {
    it('updates firstName and lastName', async () => {
      const updated = { _id: 'user-1', firstName: 'Jane', lastName: 'Doe' };
      (User.findOneAndUpdate as jest.Mock).mockReturnValue(mockExec(updated));

      await RequestContext.run(ownerContext, async () => {
        const result = await service.updateMyProfile({ firstName: 'Jane', lastName: 'Doe' });
        expect(result.firstName).toBe('Jane');
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: 'user-1', tenantId: 'tenant-1' },
          { $set: { firstName: 'Jane', lastName: 'Doe' } },
          { new: true }
        );
      });
    });

    it('throws NotFoundError when user not found', async () => {
      (User.findOneAndUpdate as jest.Mock).mockReturnValue(mockExec(null));

      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateMyProfile({ firstName: 'X' })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('changeMyPassword', () => {
    it('changes password and invalidates refresh tokens', async () => {
      const passwordHash = await bcrypt.hash('OldPassword123!', 10);
      const user = {
        _id: 'user-1',
        passwordHash,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (User.findOne as jest.Mock).mockReturnValue(mockSelectExec(user));

      await RequestContext.run(ownerContext, async () => {
        await service.changeMyPassword({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        });

        expect(user.save).toHaveBeenCalled();
        expect(mockRedis.del).toHaveBeenCalledWith('refresh:user-1');
      });
    });

    it('throws UnauthorizedError when current password is wrong', async () => {
      const user = {
        _id: 'user-1',
        passwordHash: await bcrypt.hash('CorrectPassword', 10),
      };
      (User.findOne as jest.Mock).mockReturnValue(mockSelectExec(user));

      await RequestContext.run(ownerContext, async () => {
        await expect(
          service.changeMyPassword({ currentPassword: 'WrongPassword', newPassword: 'New123!' })
        ).rejects.toThrow(UnauthorizedError);
      });
    });

    it('throws ConflictError when new password is same as current', async () => {
      const currentPw = 'SamePassword123!';
      const user = {
        _id: 'user-1',
        passwordHash: await bcrypt.hash(currentPw, 10),
      };
      (User.findOne as jest.Mock).mockReturnValue(mockSelectExec(user));

      await RequestContext.run(ownerContext, async () => {
        await expect(
          service.changeMyPassword({ currentPassword: currentPw, newPassword: currentPw })
        ).rejects.toThrow(ConflictError);
      });
    });
  });

  describe('updateRole', () => {
    it('allows owner to change role', async () => {
      const updated = { _id: 'user-2', role: 'admin' };
      (User.findOneAndUpdate as jest.Mock).mockReturnValue(mockExec(updated));

      await RequestContext.run(ownerContext, async () => {
        const result = await service.updateRole('user-2', 'admin');
        expect(result.role).toBe('admin');
      });
    });

    it('throws ForbiddenError when member tries to change role', async () => {
      await RequestContext.run(memberContext, async () => {
        await expect(service.updateRole('user-3', 'admin')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws ForbiddenError when assigning owner role', async () => {
      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateRole('user-2', 'owner')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws ForbiddenError when changing own role', async () => {
      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateRole('user-1', 'admin')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when target user does not exist', async () => {
      (User.findOneAndUpdate as jest.Mock).mockReturnValue(mockExec(null));

      await RequestContext.run(ownerContext, async () => {
        await expect(service.updateRole('nonexistent', 'admin')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('deactivate', () => {
    it('soft deletes user and invalidates tokens', async () => {
      const target = { _id: 'user-2', role: 'member' };
      (User.findOne as jest.Mock).mockReturnValue(mockExec(target));
      (User.findOneAndUpdate as jest.Mock).mockReturnValue(mockExec(target));

      await RequestContext.run(ownerContext, async () => {
        await service.deactivate('user-2');
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: 'user-2', tenantId: 'tenant-1' },
          { deletedAt: expect.any(Date) }
        );
        expect(mockRedis.del).toHaveBeenCalledWith('refresh:user-2');
      });
    });

    it('throws ForbiddenError when member tries to deactivate', async () => {
      await RequestContext.run(memberContext, async () => {
        await expect(service.deactivate('user-3')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws ForbiddenError when trying to deactivate self', async () => {
      await RequestContext.run(ownerContext, async () => {
        await expect(service.deactivate('user-1')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws ForbiddenError when trying to deactivate an owner', async () => {
      const target = { _id: 'owner-2', role: 'owner' };
      (User.findOne as jest.Mock).mockReturnValue(mockExec(target));

      await RequestContext.run(ownerContext, async () => {
        await expect(service.deactivate('owner-2')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when target user does not exist', async () => {
      (User.findOne as jest.Mock).mockReturnValue(mockExec(null));

      await RequestContext.run(ownerContext, async () => {
        await expect(service.deactivate('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });
});
