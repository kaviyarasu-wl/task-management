import { ProjectService } from '../../src/modules/project/project.service';
import { ProjectRepository } from '../../src/modules/project/project.repository';
import { RequestContext } from '../../src/core/context/RequestContext';
import { NotFoundError, ForbiddenError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/project/project.repository');

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
  email: 'member@example.com',
  role: 'member' as const,
};

describe('ProjectService', () => {
  let service: ProjectService;
  let mockRepo: jest.Mocked<ProjectRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectService();
    mockRepo = (ProjectRepository as jest.MockedClass<typeof ProjectRepository>)
      .mock.instances[0] as jest.Mocked<ProjectRepository>;
  });

  describe('list', () => {
    it('returns paginated projects for the tenant', async () => {
      const mockResult = {
        data: [{ _id: 'p1', name: 'Project 1' }],
        total: 1,
        nextCursor: null,
      };
      mockRepo.findAll.mockResolvedValue(mockResult as never);

      await RequestContext.run(ownerContext, async () => {
        const result = await service.list({ limit: 10 });
        expect(result).toEqual(mockResult);
        expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1', { limit: 10 });
      });
    });
  });

  describe('getById', () => {
    it('returns project when found', async () => {
      const mockProject = { _id: 'p1', name: 'Test Project', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(mockProject as never);

      await RequestContext.run(ownerContext, async () => {
        const project = await service.getById('p1');
        expect(project).toEqual(mockProject);
        expect(mockRepo.findById).toHaveBeenCalledWith('tenant-1', 'p1');
      });
    });

    it('throws NotFoundError when project does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('create', () => {
    it('creates project with tenantId and ownerId from context', async () => {
      const mockProject = { _id: 'p1', name: 'New Project', tenantId: 'tenant-1', ownerId: 'user-1' };
      mockRepo.create.mockResolvedValue(mockProject as never);

      await RequestContext.run(ownerContext, async () => {
        const project = await service.create({ name: 'New Project', description: 'A project' });
        expect(project).toEqual(mockProject);
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'tenant-1',
            ownerId: 'user-1',
            name: 'New Project',
            description: 'A project',
          })
        );
      });
    });
  });

  describe('update', () => {
    it('allows project owner to update', async () => {
      const existing = { _id: 'p1', ownerId: 'user-1', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue({ ...existing, name: 'Updated' } as never);

      await RequestContext.run(ownerContext, async () => {
        const updated = await service.update('p1', { name: 'Updated' });
        expect(updated.name).toBe('Updated');
      });
    });

    it('allows admin to update any project', async () => {
      const adminContext = { ...ownerContext, userId: 'admin-1', role: 'admin' as const };
      const existing = { _id: 'p1', ownerId: 'other-user', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue({ ...existing, name: 'Updated' } as never);

      await RequestContext.run(adminContext, async () => {
        const updated = await service.update('p1', { name: 'Updated' });
        expect(updated.name).toBe('Updated');
      });
    });

    it('throws ForbiddenError when member tries to update others project', async () => {
      const existing = { _id: 'p1', ownerId: 'other-user', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.update('p1', { name: 'Updated' })).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when project does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
      });
    });

    it('throws NotFoundError when update returns null', async () => {
      const existing = { _id: 'p1', ownerId: 'user-1', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.update('p1', { name: 'Updated' })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('delete', () => {
    it('allows project owner to delete', async () => {
      const existing = { _id: 'p1', ownerId: 'user-1', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.softDelete.mockResolvedValue(true);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.delete('p1')).resolves.not.toThrow();
        expect(mockRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'p1');
      });
    });

    it('throws ForbiddenError when member tries to delete others project', async () => {
      const existing = { _id: 'p1', ownerId: 'other-user', tenantId: 'tenant-1' };
      mockRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.delete('p1')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when project does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await RequestContext.run(ownerContext, async () => {
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });
});
