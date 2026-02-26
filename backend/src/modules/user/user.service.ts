import bcrypt from 'bcryptjs';
import { User, IUser } from './user.model';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, ForbiddenError, ConflictError, UnauthorizedError } from '@core/errors/AppError';
import { getRedisClient } from '@infrastructure/redis/client';
import { UserRole } from '../../types';

const BCRYPT_ROUNDS = 12;

export class UserService {
  // ─── Read ──────────────────────────────────────────────────────────────────

  async getMyProfile(): Promise<IUser> {
    const { userId, tenantId } = RequestContext.get();
    const user = await User.findOne({ _id: userId, tenantId }).exec();
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async getProfile(targetUserId: string): Promise<IUser> {
    const { tenantId } = RequestContext.get();
    const user = await User.findOne({ _id: targetUserId, tenantId }).exec();
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async listByTenant(filters?: { role?: UserRole }): Promise<IUser[]> {
    const { tenantId } = RequestContext.get();
    const query: Record<string, unknown> = { tenantId };
    if (filters?.role) query['role'] = filters.role;
    return User.find(query).sort({ createdAt: -1 }).exec();
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateMyProfile(data: {
    firstName?: string;
    lastName?: string;
  }): Promise<IUser> {
    const { userId, tenantId } = RequestContext.get();
    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId },
      { $set: data },
      { new: true }
    ).exec();
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async changeMyPassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const { userId, tenantId } = RequestContext.get();

    // passwordHash excluded by default — select it explicitly
    const user = await User.findOne({ _id: userId, tenantId }).select('+passwordHash').exec();
    if (!user) throw new NotFoundError('User');

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Current password is incorrect');

    if (data.currentPassword === data.newPassword) {
      throw new ConflictError('New password must differ from current password');
    }

    user.passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
    await user.save();

    // Invalidate all refresh tokens — force re-login on all devices
    const redis = getRedisClient();
    await redis.del(`refresh:${userId}`);
  }

  // ─── Role & Deactivation (admin/owner actions) ─────────────────────────────

  async updateRole(targetUserId: string, newRole: UserRole): Promise<IUser> {
    const { tenantId, userId, role } = RequestContext.get();

    if (!['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only owners and admins can change roles');
    }
    if (newRole === 'owner') {
      throw new ForbiddenError('Cannot assign owner role — use ownership transfer');
    }
    if (targetUserId === userId) {
      throw new ForbiddenError('Cannot change your own role');
    }

    const updated = await User.findOneAndUpdate(
      { _id: targetUserId, tenantId },
      { role: newRole },
      { new: true }
    ).exec();
    if (!updated) throw new NotFoundError('User');
    return updated;
  }

  async deactivate(targetUserId: string): Promise<void> {
    const { tenantId, userId, role } = RequestContext.get();

    if (!['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only owners and admins can deactivate users');
    }
    if (targetUserId === userId) {
      throw new ForbiddenError('Cannot deactivate your own account');
    }

    const target = await User.findOne({ _id: targetUserId, tenantId }).exec();
    if (!target) throw new NotFoundError('User');

    // Owners cannot be deactivated — must transfer ownership first
    if (target.role === 'owner') {
      throw new ForbiddenError('Cannot deactivate the org owner — transfer ownership first');
    }

    await User.findOneAndUpdate(
      { _id: targetUserId, tenantId },
      { deletedAt: new Date() }
    ).exec();

    // Kick them off immediately — invalidate their refresh token
    const redis = getRedisClient();
    await redis.del(`refresh:${targetUserId}`);
  }
}
