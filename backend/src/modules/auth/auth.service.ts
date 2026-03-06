import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../../config';
import { getRedisClient } from '@infrastructure/redis/client';
import { AuthRepository } from './auth.repository';
import { AuthResponse, AuthTokens, JwtAccessPayload, JwtRefreshPayload, LoginInput, MfaLoginResponse, RegisterInput } from './auth.types';
import { ConflictError, NotFoundError, UnauthorizedError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { Types } from 'mongoose';
import { Role } from '@modules/role/role.model';
import { SYSTEM_ROLES } from '@modules/role/permissions';

const REFRESH_TOKEN_PREFIX = 'refresh:';
const BCRYPT_ROUNDS = 12;

export class AuthService {
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  /**
   * Register: creates a new tenant + owner user atomically.
   * If user creation fails after tenant creation, we roll back the tenant.
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const slug = input.orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await this.repo.findTenantBySlug(slug);
    if (existing) throw new ConflictError(`Organization slug "${slug}" is already taken`);

    const userId = new Types.ObjectId().toString();
    const tenantId = randomUUID();
    let tenant;

    try {
      tenant = await this.repo.createTenant({
        tenantId,
        name: input.orgName,
        slug,
        ownerId: userId, // Will update after user creation
      });

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const user = await this.repo.createUser({
        tenantId,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: 'owner',
      });

      // Update tenant with real ownerId
      tenant.ownerId = user.id as string;
      await tenant.save();

      await EventBus.emit('tenant.created', {
        tenantId,
        ownerId: user.id as string,
        plan: 'free',
      });

      // Load role permissions (owner role seeded by tenant.created event)
      const rolePermissions = await this.loadRolePermissions(tenantId, 'owner', user.roleId?.toString());

      const tokens = await this.generateTokens({
        userId: user.id as string,
        tenantId,
        email: user.email,
        role: 'owner',
        rolePermissions,
        locale: user.locale,
      });

      return {
        user: {
          _id: user.id as string,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: 'owner',
          tenantId,
        },
        ...tokens,
      };
    } catch (err) {
      // Rollback tenant if something failed mid-way
      if (tenant) await tenant.deleteOne();
      throw err;
    }
  }

  async login(input: LoginInput): Promise<AuthResponse | MfaLoginResponse> {
    const tenant = await this.repo.findTenantBySlug(input.tenantSlug);
    if (!tenant) throw new NotFoundError('Organization');

    const user = await this.repo.findUserByEmail(tenant.tenantId, input.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Invalid credentials');

    await this.repo.updateLastLogin(user.id as string);

    // Check if MFA is enabled — return mfaToken instead of full tokens
    if (user.mfaEnabled) {
      const { MfaService } = await import('./mfa/mfa.service');
      const mfaService = new MfaService();
      const mfaToken = mfaService.generateMfaToken(
        user.id as string,
        tenant.tenantId,
        user.email,
        user.role
      );
      return { requiresMfa: true as const, mfaToken };
    }

    // Load role permissions from Role collection
    const rolePermissions = await this.loadRolePermissions(tenant.tenantId, user.role, user.roleId?.toString());

    const tokens = await this.generateTokens({
      userId: user.id as string,
      tenantId: tenant.tenantId,
      email: user.email,
      role: user.role,
      rolePermissions,
      locale: user.locale,
    });

    return {
      user: {
        _id: user.id as string,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: tenant.tenantId,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtRefreshPayload;
    try {
      payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const redis = getRedisClient();
    const storedToken = await redis.get(`${REFRESH_TOKEN_PREFIX}${payload.userId}`);

    if (storedToken !== refreshToken) {
      // Token reuse detected — invalidate all sessions for this user
      await redis.del(`${REFRESH_TOKEN_PREFIX}${payload.userId}`);
      throw new UnauthorizedError('Refresh token reuse detected. Please login again.');
    }

    const user = await this.repo.findUserById(payload.userId);
    if (!user) throw new UnauthorizedError('User not found');

    // Reload role permissions on refresh to pick up any role changes
    const rolePermissions = await this.loadRolePermissions(payload.tenantId, user.role, user.roleId?.toString());

    return this.generateTokens({
      userId: user.id as string,
      tenantId: payload.tenantId,
      email: user.email,
      role: user.role,
      rolePermissions,
      locale: user.locale,
    });
  }

  async logout(userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
  }

  /**
   * Load role permissions from the Role collection.
   * If roleId is set, load by ID. Otherwise, fall back to slug matching.
   * Returns undefined if no role found (pre-migration backward compat via SYSTEM_ROLES).
   */
  private async loadRolePermissions(
    tenantId: string,
    roleSlug: string,
    roleId?: string
  ): Promise<string[] | undefined> {
    // Try loading by roleId first (post-migration)
    if (roleId) {
      const role = await Role.findOne({ _id: roleId, tenantId, deletedAt: null }).lean();
      if (role) return role.permissions;
    }

    // Fall back to slug match (pre-migration or seeded roles)
    const role = await Role.findOne({ tenantId, slug: roleSlug, deletedAt: null }).lean();
    if (role) return role.permissions;

    // Final fallback: use static SYSTEM_ROLES definition (before any seeding)
    const systemRole = SYSTEM_ROLES[roleSlug as keyof typeof SYSTEM_ROLES];
    return systemRole?.permissions;
  }

  private async generateTokens(payload: JwtAccessPayload): Promise<AuthTokens> {
    const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshPayload: JwtRefreshPayload = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      tokenFamily: randomUUID(),
    };

    const refreshToken = jwt.sign(refreshPayload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    // Store refresh token in Redis — enables instant invalidation on logout
    const redis = getRedisClient();
    const ttlSeconds = 7 * 24 * 60 * 60; // 7 days
    await redis.setex(`${REFRESH_TOKEN_PREFIX}${payload.userId}`, ttlSeconds, refreshToken);

    return { accessToken, refreshToken };
  }
}
