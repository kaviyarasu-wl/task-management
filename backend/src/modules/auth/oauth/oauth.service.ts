import { randomUUID, createHmac } from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../../config';
import { IOAuthProvider } from './providers/base.provider';
import { GoogleProvider } from './providers/google.provider';
import { GitHubProvider } from './providers/github.provider';
import { MicrosoftProvider } from './providers/microsoft.provider';
import { OAuthAccount } from './oauth-account.model';
import { OAuthProvider, OAuthUserProfile, OAuthTokens, AuthTokens, JwtAccessPayload, JwtRefreshPayload } from '../auth.types';
import { AuthRepository } from '../auth.repository';
import { RequestContext } from '@core/context/RequestContext';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { getRedisClient } from '@infrastructure/redis/client';

const OAUTH_STATE_PREFIX = 'oauth_state:';
const STATE_TTL_SECONDS = 600; // 10 minutes
const REFRESH_TOKEN_PREFIX = 'refresh:';

interface OAuthState {
  tenantSlug?: string;
  inviteToken?: string;
  action: 'login' | 'register';
  nonce: string;
}

export class OAuthService {
  private providers: Map<string, IOAuthProvider> = new Map();
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
      this.providers.set('google', new GoogleProvider({
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackUrl: `${config.OAUTH_CALLBACK_BASE_URL}/api/v1/auth/oauth/google/callback`,
      }));
    }

    if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
      this.providers.set('github', new GitHubProvider({
        clientId: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
        callbackUrl: `${config.OAUTH_CALLBACK_BASE_URL}/api/v1/auth/oauth/github/callback`,
      }));
    }

    if (config.MICROSOFT_CLIENT_ID && config.MICROSOFT_CLIENT_SECRET) {
      this.providers.set('microsoft', new MicrosoftProvider({
        clientId: config.MICROSOFT_CLIENT_ID,
        clientSecret: config.MICROSOFT_CLIENT_SECRET,
        callbackUrl: `${config.OAUTH_CALLBACK_BASE_URL}/api/v1/auth/oauth/microsoft/callback`,
      }));
    }
  }

  private getProvider(name: string): IOAuthProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new BadRequestError(`OAuth provider "${name}" is not configured`);
    return provider;
  }

  /**
   * Generate redirect URL and store state in Redis.
   */
  async getRedirectUrl(
    providerName: OAuthProvider,
    options: { tenantSlug?: string; inviteToken?: string; action?: string }
  ): Promise<string> {
    const provider = this.getProvider(providerName);

    const statePayload: OAuthState = {
      tenantSlug: options.tenantSlug,
      inviteToken: options.inviteToken,
      action: (options.action as 'login' | 'register') ?? 'login',
      nonce: randomUUID(),
    };

    // Store state in Redis with TTL for CSRF protection
    const stateKey = `${OAUTH_STATE_PREFIX}${statePayload.nonce}`;
    const redis = getRedisClient();
    await redis.setex(stateKey, STATE_TTL_SECONDS, JSON.stringify(statePayload));

    // Sign the nonce so it cannot be tampered with
    const stateParam = this.signState(statePayload.nonce);

    return provider.getAuthorizationUrl(stateParam);
  }

  /**
   * Handle OAuth callback: exchange code, find/create user, return JWT tokens.
   */
  async handleCallback(
    providerName: OAuthProvider,
    code: string,
    stateParam: string
  ): Promise<{ tokens: AuthTokens; isNewUser: boolean }> {
    // 1. Verify state (CSRF protection)
    const nonce = this.verifyState(stateParam);
    const redis = getRedisClient();
    const stateKey = `${OAUTH_STATE_PREFIX}${nonce}`;
    const stateJson = await redis.get(stateKey);

    if (!stateJson) throw new UnauthorizedError('OAuth state expired or invalid');
    await redis.del(stateKey); // One-time use

    const state: OAuthState = JSON.parse(stateJson);

    // 2. Exchange code for tokens + profile
    const provider = this.getProvider(providerName);
    const oauthTokens = await provider.exchangeCode(code);
    const profile = await provider.getUserProfile(oauthTokens.accessToken);

    // 3. Find existing OAuth account
    const existingOAuth = await OAuthAccount.findOne({
      provider: providerName,
      providerUserId: profile.providerUserId,
      deletedAt: null,
    });

    if (existingOAuth) {
      // Returning user — update tokens and issue JWT
      existingOAuth.accessToken = oauthTokens.accessToken;
      if (oauthTokens.refreshToken) existingOAuth.refreshToken = oauthTokens.refreshToken;
      if (oauthTokens.expiresIn) {
        existingOAuth.tokenExpiresAt = new Date(Date.now() + oauthTokens.expiresIn * 1000);
      }
      await existingOAuth.save();

      const user = await this.repo.findUserById(existingOAuth.userId.toString());
      if (!user) throw new NotFoundError('User');

      const tokens = await this.generateTokens({
        userId: user.id as string,
        tenantId: existingOAuth.tenantId,
        email: user.email,
        role: user.role,
      });

      return { tokens, isNewUser: false };
    }

    // 4. New OAuth account — create user or match by email
    return this.handleNewOAuthUser(providerName, profile, oauthTokens, state);
  }

  /**
   * Link an OAuth account to the currently authenticated user.
   */
  async linkAccount(
    providerName: OAuthProvider,
    code: string,
    redirectUri: string
  ): Promise<{ provider: string; email: string; linkedAt: Date }> {
    const { userId, tenantId } = RequestContext.get();
    const provider = this.getProvider(providerName);

    const oauthTokens = await provider.exchangeCode(code, redirectUri);
    const profile = await provider.getUserProfile(oauthTokens.accessToken);

    // Check if this provider account is already linked to someone
    const existing = await OAuthAccount.findOne({
      provider: providerName,
      providerUserId: profile.providerUserId,
      deletedAt: null,
    });

    if (existing) {
      if (existing.userId.toString() === userId) {
        throw new ConflictError('This account is already linked');
      }
      throw new ConflictError('This OAuth account is linked to a different user');
    }

    const oauthAccount = new OAuthAccount({
      tenantId,
      userId,
      provider: providerName,
      providerUserId: profile.providerUserId,
      email: profile.email,
      accessToken: oauthTokens.accessToken,
      refreshToken: oauthTokens.refreshToken,
      tokenExpiresAt: oauthTokens.expiresIn
        ? new Date(Date.now() + oauthTokens.expiresIn * 1000)
        : undefined,
      profile: {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        raw: profile.raw,
      },
    });

    await oauthAccount.save();

    await EventBus.emit('user.oauthLinked', {
      userId,
      tenantId,
      provider: providerName,
    });

    return {
      provider: providerName,
      email: profile.email,
      linkedAt: oauthAccount.createdAt,
    };
  }

  /**
   * Unlink an OAuth account. Requires user to have a password or other linked accounts.
   */
  async unlinkAccount(providerName: OAuthProvider): Promise<void> {
    const { userId, tenantId } = RequestContext.get();

    // Ensure user has a password (cannot remove last auth method)
    const user = await this.repo.findUserByIdWithPassword(userId);
    if (!user) throw new NotFoundError('User');

    const linkedAccounts = await OAuthAccount.countDocuments({
      tenantId,
      userId,
      deletedAt: null,
    });

    const hasPassword = Boolean(user.passwordHash);
    if (!hasPassword && linkedAccounts <= 1) {
      throw new BadRequestError(
        'Cannot unlink last authentication method. Set a password first.'
      );
    }

    const account = await OAuthAccount.findOne({
      tenantId,
      userId,
      provider: providerName,
      deletedAt: null,
    });

    if (!account) throw new NotFoundError('OAuth account');

    account.deletedAt = new Date();
    await account.save();
  }

  /**
   * List linked OAuth accounts for current user.
   */
  async getLinkedAccounts(): Promise<Array<{
    provider: string;
    email: string;
    profile: { displayName: string | null; avatarUrl: string | null };
    linkedAt: Date;
  }>> {
    const { userId, tenantId } = RequestContext.get();

    const accounts = await OAuthAccount.find({
      tenantId,
      userId,
      deletedAt: null,
    })
      .select('provider email profile createdAt')
      .lean();

    return accounts.map((a) => ({
      provider: a.provider,
      email: a.email,
      profile: {
        displayName: a.profile.displayName,
        avatarUrl: a.profile.avatarUrl,
      },
      linkedAt: a.createdAt,
    }));
  }

  // ── Private helpers ───────────────────────────────────────────

  private async handleNewOAuthUser(
    providerName: OAuthProvider,
    profile: OAuthUserProfile,
    oauthTokens: OAuthTokens,
    state: OAuthState
  ): Promise<{ tokens: AuthTokens; isNewUser: boolean }> {
    let tenantId: string;
    let isNewUser = false;

    if (state.tenantSlug) {
      // Login to existing tenant — find user by email
      const tenant = await this.repo.findTenantBySlug(state.tenantSlug);
      if (!tenant) throw new NotFoundError('Organization');
      tenantId = tenant.tenantId;

      let user = await this.repo.findUserByEmail(tenantId, profile.email);

      if (!user) {
        // Create user in the tenant (if action is register or invite exists)
        if (state.action !== 'register' && !state.inviteToken) {
          throw new UnauthorizedError('No account found. Register first.');
        }

        user = await this.repo.createUser({
          tenantId,
          email: profile.email,
          passwordHash: '', // No password for OAuth-only users
          firstName: profile.displayName?.split(' ')[0] ?? 'User',
          lastName: profile.displayName?.split(' ').slice(1).join(' ') ?? '',
          role: 'member',
        });
        isNewUser = true;
      }

      // Create OAuth account link
      await this.createOAuthAccount(
        tenantId, user.id as string, providerName, profile, oauthTokens
      );

      const tokens = await this.generateTokens({
        userId: user.id as string,
        tenantId,
        email: user.email,
        role: user.role,
      });

      return { tokens, isNewUser };
    }

    // No tenant slug — cannot determine which tenant to use
    throw new BadRequestError(
      'tenantSlug is required for OAuth login. Register via the UI to create a new organization.'
    );
  }

  private async createOAuthAccount(
    tenantId: string,
    userId: string,
    providerName: OAuthProvider,
    profile: OAuthUserProfile,
    oauthTokens: OAuthTokens
  ): Promise<void> {
    const oauthAccount = new OAuthAccount({
      tenantId,
      userId,
      provider: providerName,
      providerUserId: profile.providerUserId,
      email: profile.email,
      accessToken: oauthTokens.accessToken,
      refreshToken: oauthTokens.refreshToken,
      tokenExpiresAt: oauthTokens.expiresIn
        ? new Date(Date.now() + oauthTokens.expiresIn * 1000)
        : undefined,
      profile: {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        raw: profile.raw,
      },
    });
    await oauthAccount.save();
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

  private signState(nonce: string): string {
    const secret = config.OAUTH_STATE_SECRET ?? config.JWT_ACCESS_SECRET;
    const signature = createHmac('sha256', secret).update(nonce).digest('hex');
    return `${nonce}.${signature}`;
  }

  private verifyState(stateParam: string): string {
    const [nonce, signature] = stateParam.split('.');
    if (!nonce || !signature) throw new UnauthorizedError('Invalid OAuth state');

    const secret = config.OAUTH_STATE_SECRET ?? config.JWT_ACCESS_SECRET;
    const expectedSig = createHmac('sha256', secret).update(nonce).digest('hex');

    if (signature !== expectedSig) throw new UnauthorizedError('OAuth state tampered');
    return nonce;
  }
}
