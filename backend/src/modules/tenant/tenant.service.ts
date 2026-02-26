import { TenantRepository } from './tenant.repository';
import { RequestContext } from '@core/context/RequestContext';
import { ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { UserRole } from '../../types';
import { ITenant } from './tenant.model';
import { IUser } from '../user/user.model';

export class TenantService {
  private repo: TenantRepository;

  constructor() {
    this.repo = new TenantRepository();
  }

  async getMyOrg(): Promise<ITenant> {
    const { tenantId } = RequestContext.get();
    const tenant = await this.repo.findById(tenantId);
    if (!tenant) throw new NotFoundError('Organization');
    return tenant;
  }

  async updateSettings(settings: Partial<ITenant['settings']>): Promise<ITenant> {
    const { tenantId, role } = RequestContext.get();
    if (!['owner', 'admin'].includes(role)) throw new ForbiddenError('Only owners and admins can update settings');

    const tenant = await this.repo.updateSettings(tenantId, settings);
    if (!tenant) throw new NotFoundError('Organization');
    return tenant;
  }

  async getMembers(): Promise<IUser[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.getUsersInTenant(tenantId);
  }

  async updateMemberRole(targetUserId: string, newRole: UserRole): Promise<IUser> {
    const { tenantId, role, userId } = RequestContext.get();

    if (role !== 'owner' && role !== 'admin') throw new ForbiddenError('Only owners and admins can change roles');
    if (newRole === 'owner') throw new ForbiddenError('Cannot assign owner role — transfer ownership instead');
    if (targetUserId === userId) throw new ForbiddenError('Cannot change your own role');

    const updated = await this.repo.updateUserRole(tenantId, targetUserId, newRole);
    if (!updated) throw new NotFoundError('User');
    return updated;
  }

  async removeMember(targetUserId: string): Promise<void> {
    const { tenantId, role, userId } = RequestContext.get();

    if (role !== 'owner' && role !== 'admin') throw new ForbiddenError('Only owners and admins can remove members');
    if (targetUserId === userId) throw new ForbiddenError('Cannot remove yourself');

    await this.repo.removeUser(tenantId, targetUserId);

    await EventBus.emit('user.removed', {
      userId: targetUserId,
      tenantId,
      removedBy: userId,
    });
  }
}
