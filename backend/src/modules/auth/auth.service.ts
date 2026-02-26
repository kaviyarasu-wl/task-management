import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../../config';
import { getRedisClient } from '@infrastructure/redis/client';
import { AuthRepository } from './auth.repository';
import { AuthResponse, AuthTokens, JwtAccessPayload, JwtRefreshPayload, LoginInput, RegisterInput } from './auth.types';
import { ConflictError, NotFoundError, UnauthorizedError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { Types } from 'mongoose';

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

      const tokens = await this.generateTokens({
        userId: user.id as string,
        tenantId,
        email: user.email,
        role: 'owner',
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

  async login(input: LoginInput): Promise<AuthResponse> {
    const tenant = await this.repo.findTenantBySlug(input.tenantSlug);
    if (!tenant) throw new NotFoundError('Organization');

    const user = await this.repo.findUserByEmail(tenant.tenantId, input.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Invalid credentials');

    await this.repo.updateLastLogin(user.id as string);

    const tokens = await this.generateTokens({
      userId: user.id as string,
      tenantId: tenant.tenantId,
      email: user.email,
      role: user.role,
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

    return this.generateTokens({
      userId: user.id as string,
      tenantId: payload.tenantId,
      email: user.email,
      role: user.role,
    });
  }

  async logout(userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
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
