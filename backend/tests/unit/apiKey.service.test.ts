import { ApiKeyService } from '../../src/modules/apiKey/apiKey.service';
import { ApiKeyRepository } from '../../src/modules/apiKey/apiKey.repository';
import { RequestContext } from '../../src/core/context/RequestContext';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../src/core/errors/AppError';
import bcrypt from 'bcryptjs';

jest.mock('../../src/modules/apiKey/apiKey.repository');

const adminContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'admin@example.com',
  role: 'admin' as const,
  requestId: 'req-1',
  locale: 'en',
};

const memberContext = {
  ...adminContext,
  userId: 'user-2',
  role: 'member' as const,
};

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let mockRepo: jest.Mocked<ApiKeyRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ApiKeyService();
    mockRepo = (ApiKeyRepository as jest.MockedClass<typeof ApiKeyRepository>)
      .mock.instances[0] as jest.Mocked<ApiKeyRepository>;
  });

  describe('create', () => {
    it('generates API key with tsk_ prefix', async () => {
      mockRepo.countByTenant.mockResolvedValue(0);
      mockRepo.create.mockResolvedValue({ _id: 'ak-1', name: 'Test Key' } as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.create({
          name: 'Test Key',
          permissions: ['tasks:read'] as never,
        });

        expect(result.rawKey).toMatch(/^tsk_/);
        expect(result.apiKey).toBeDefined();
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'tenant-1',
            name: 'Test Key',
            keyHash: expect.any(String),
            keyPrefix: expect.stringMatching(/^tsk_/),
          })
        );
      });
    });

    it('throws BadRequestError when tenant limit reached', async () => {
      mockRepo.countByTenant.mockResolvedValue(20);

      await RequestContext.run(adminContext, async () => {
        await expect(
          service.create({ name: 'Key', permissions: ['tasks:read'] as never })
        ).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe('verify', () => {
    it('returns API key when valid', async () => {
      const rawKey = `tsk_${Buffer.from('test-raw-key-data').toString('base64url')}`;
      const keyHash = await bcrypt.hash(rawKey, 10);
      const apiKey = {
        _id: 'ak-1',
        keyHash,
        isActive: true,
        expiresAt: null,
      };
      mockRepo.findByPrefix.mockResolvedValue([apiKey] as never);

      const result = await service.verify(rawKey);
      expect(result).toEqual(apiKey);
    });

    it('returns null for non-tsk_ prefix', async () => {
      const result = await service.verify('invalid_key');
      expect(result).toBeNull();
    });

    it('returns null for inactive key', async () => {
      const rawKey = `tsk_${Buffer.from('test-raw-key-data').toString('base64url')}`;
      const keyHash = await bcrypt.hash(rawKey, 10);
      const apiKey = { _id: 'ak-1', keyHash, isActive: false };
      mockRepo.findByPrefix.mockResolvedValue([apiKey] as never);

      const result = await service.verify(rawKey);
      expect(result).toBeNull();
    });

    it('returns null for expired key', async () => {
      const rawKey = `tsk_${Buffer.from('test-raw-key-data').toString('base64url')}`;
      const keyHash = await bcrypt.hash(rawKey, 10);
      const apiKey = {
        _id: 'ak-1',
        keyHash,
        isActive: true,
        expiresAt: new Date('2020-01-01'),
      };
      mockRepo.findByPrefix.mockResolvedValue([apiKey] as never);

      const result = await service.verify(rawKey);
      expect(result).toBeNull();
    });

    it('returns null when no matching key found', async () => {
      mockRepo.findByPrefix.mockResolvedValue([]);

      const result = await service.verify('tsk_nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('returns true when permission exists', () => {
      const apiKey = { permissions: ['tasks:read', 'tasks:write'] } as never;
      expect(service.hasPermission(apiKey, 'tasks:read' as never)).toBe(true);
    });

    it('returns false when permission missing', () => {
      const apiKey = { permissions: ['tasks:read'] } as never;
      expect(service.hasPermission(apiKey, 'tasks:write' as never)).toBe(false);
    });
  });

  describe('recordUsage', () => {
    it('updates last used timestamp and IP', async () => {
      mockRepo.updateUsage.mockResolvedValue(undefined);

      await service.recordUsage('ak-1', '192.168.1.1');
      expect(mockRepo.updateUsage).toHaveBeenCalledWith('ak-1', {
        lastUsedAt: expect.any(Date),
        lastUsedIp: '192.168.1.1',
      });
    });
  });

  describe('list', () => {
    it('returns all API keys for the tenant', async () => {
      const keys = [{ _id: 'ak-1' }, { _id: 'ak-2' }];
      mockRepo.findByTenant.mockResolvedValue(keys as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.list();
        expect(result).toEqual(keys);
      });
    });
  });

  describe('getById', () => {
    it('returns API key when found', async () => {
      const key = { _id: 'ak-1', name: 'Test' };
      mockRepo.findById.mockResolvedValue(key as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.getById('ak-1');
        expect(result).toEqual(key);
      });
    });

    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(adminContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('update', () => {
    it('allows admin to update API key', async () => {
      const existing = { _id: 'ak-1' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue({ ...existing, name: 'Updated' } as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.update('ak-1', { name: 'Updated' });
        expect(result.name).toBe('Updated');
      });
    });

    it('throws ForbiddenError when member tries to update', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'ak-1' } as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.update('ak-1', { name: 'X' })).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when key not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(adminContext, async () => {
        await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('revoke', () => {
    it('deactivates the API key', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'ak-1' } as never);
      mockRepo.update.mockResolvedValue({ _id: 'ak-1', isActive: false } as never);

      await RequestContext.run(adminContext, async () => {
        await service.revoke('ak-1');
        expect(mockRepo.update).toHaveBeenCalledWith('tenant-1', 'ak-1', { isActive: false });
      });
    });

    it('throws ForbiddenError when member tries to revoke', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'ak-1' } as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.revoke('ak-1')).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('delete', () => {
    it('soft deletes API key', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'ak-1' } as never);
      mockRepo.softDelete.mockResolvedValue(true);

      await RequestContext.run(adminContext, async () => {
        await service.delete('ak-1');
        expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'ak-1');
      });
    });

    it('throws ForbiddenError when member tries to delete', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'ak-1' } as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.delete('ak-1')).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('regenerate', () => {
    it('generates new key and returns rawKey', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'ak-1' } as never);
      mockRepo.updateKeyHash.mockResolvedValue({ _id: 'ak-1', name: 'Key' } as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.regenerate('ak-1');
        expect(result.rawKey).toMatch(/^tsk_/);
        expect(result.apiKey).toBeDefined();
      });
    });

    it('throws ForbiddenError when member tries to regenerate', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'ak-1' } as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.regenerate('ak-1')).rejects.toThrow(ForbiddenError);
      });
    });
  });
});
