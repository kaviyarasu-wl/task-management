import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'crypto';
import { config } from '../../../config';
import { encryptSecret, decryptSecret } from './mfa.encryption';
import { RequestContext } from '@core/context/RequestContext';
import { getRedisClient } from '@infrastructure/redis/client';
import { User, IUser } from '@modules/user/user.model';
import { MfaTokenPayload, AuthResponse } from '../auth.types';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '@core/errors/AppError';

const MFA_TOKEN_EXPIRES = '5m';
const MFA_SETUP_SECRET_TTL = 600; // 10 minutes to complete setup
const MFA_SETUP_PREFIX = 'mfa_setup:';
const RECOVERY_CODE_COUNT = 8;
const BCRYPT_ROUNDS = 10;

export class MfaService {
  /**
   * Generate a TOTP secret and QR code for setup.
   * Stores the secret temporarily in Redis until verify-setup confirms it.
   */
  async generateSetup(): Promise<{
    secret: string;
    qrCodeUrl: string;
    otpauthUrl: string;
  }> {
    const { userId, email } = RequestContext.get();

    const secretObj = speakeasy.generateSecret({
      name: `${config.MFA_ISSUER_NAME}:${email}`,
      issuer: config.MFA_ISSUER_NAME,
      length: 20,
    });

    const otpauthUrl = secretObj.otpauth_url!;
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily in Redis so verify-setup can retrieve it
    const redis = getRedisClient();
    await redis.setex(`${MFA_SETUP_PREFIX}${userId}`, MFA_SETUP_SECRET_TTL, secretObj.base32);

    return {
      secret: secretObj.base32,
      qrCodeUrl,
      otpauthUrl,
    };
  }

  /**
   * Verify the first TOTP code and activate MFA.
   * Retrieves the pending secret from Redis and returns recovery codes.
   */
  async verifySetup(code: string): Promise<{ recoveryCodes: string[] }> {
    const { userId, tenantId } = RequestContext.get();

    // Retrieve the pending secret from Redis
    const redis = getRedisClient();
    const secret = await redis.get(`${MFA_SETUP_PREFIX}${userId}`);

    if (!secret) {
      throw new BadRequestError(
        'MFA setup session expired. Please start setup again.'
      );
    }

    // Verify the TOTP code against the pending secret
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1, // Allow 1 step tolerance (30s before/after)
    });

    if (!isValid) {
      throw new BadRequestError(
        'Invalid verification code. Check your authenticator app.'
      );
    }

    // Generate recovery codes
    const plainRecoveryCodes = this.generateRecoveryCodes();

    // Hash recovery codes for storage
    const hashedCodes = await Promise.all(
      plainRecoveryCodes.map((rc) => bcrypt.hash(rc, BCRYPT_ROUNDS))
    );

    // Encrypt the TOTP secret for storage
    const encryptedSecret = encryptSecret(secret);

    // Update user — enable MFA
    await User.findOneAndUpdate(
      { _id: userId, tenantId, deletedAt: null },
      {
        mfaEnabled: true,
        mfaSecret: encryptedSecret,
        mfaRecoveryCodes: hashedCodes,
      }
    );

    // Clean up the temporary secret from Redis
    await redis.del(`${MFA_SETUP_PREFIX}${userId}`);

    return { recoveryCodes: plainRecoveryCodes };
  }

  /**
   * Verify a TOTP code during login (after mfaToken was issued).
   */
  async verifyLoginCode(
    mfaToken: string,
    code: string
  ): Promise<AuthResponse> {
    const payload = this.verifyMfaToken(mfaToken);

    const user = await User.findOne({
      _id: payload.userId,
      tenantId: payload.tenantId,
      deletedAt: null,
    })
      .select('+mfaSecret')
      .exec();

    if (!user) throw new NotFoundError('User');
    if (!user.mfaSecret) throw new BadRequestError('MFA is not configured');

    const decryptedSecret = decryptSecret(user.mfaSecret);

    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) throw new UnauthorizedError('Invalid MFA code');

    return this.issueFullTokens(user, payload.tenantId);
  }

  /**
   * Use a recovery code during login (alternative to TOTP).
   */
  async useRecoveryCode(
    mfaToken: string,
    recoveryCode: string
  ): Promise<AuthResponse> {
    const payload = this.verifyMfaToken(mfaToken);

    const user = await User.findOne({
      _id: payload.userId,
      tenantId: payload.tenantId,
      deletedAt: null,
    })
      .select('+mfaRecoveryCodes')
      .exec();

    if (!user) throw new NotFoundError('User');
    if (!user.mfaRecoveryCodes || user.mfaRecoveryCodes.length === 0) {
      throw new BadRequestError('No recovery codes available');
    }

    // Find matching recovery code
    let matchedIndex = -1;
    for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
      const isMatch = await bcrypt.compare(
        recoveryCode.toUpperCase(),
        user.mfaRecoveryCodes[i]
      );
      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) throw new UnauthorizedError('Invalid recovery code');

    // Remove used code (single-use)
    user.mfaRecoveryCodes.splice(matchedIndex, 1);
    await user.save();

    return this.issueFullTokens(user, payload.tenantId);
  }

  /**
   * Disable MFA. Requires a valid TOTP code for safety.
   */
  async disable(code: string): Promise<void> {
    const { userId, tenantId } = RequestContext.get();

    const user = await User.findOne({
      _id: userId,
      tenantId,
      deletedAt: null,
    })
      .select('+mfaSecret')
      .exec();

    if (!user) throw new NotFoundError('User');
    if (!user.mfaEnabled) throw new BadRequestError('MFA is not enabled');

    // Verify TOTP code
    const decryptedSecret = decryptSecret(user.mfaSecret!);
    const isCodeValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isCodeValid) throw new UnauthorizedError('Invalid MFA code');

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaRecoveryCodes = [];
    await user.save();
  }

  /**
   * Generate a short-lived MFA token for the login verification step.
   */
  generateMfaToken(
    userId: string,
    tenantId: string,
    email: string,
    role: string
  ): string {
    const payload: MfaTokenPayload = {
      userId,
      tenantId,
      email,
      role,
      purpose: 'mfa_verification',
    };

    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: MFA_TOKEN_EXPIRES,
    } as jwt.SignOptions);
  }

  // ── Private helpers ───────────────────────────────────────────

  private verifyMfaToken(token: string): MfaTokenPayload {
    try {
      const payload = jwt.verify(
        token,
        config.JWT_ACCESS_SECRET
      ) as MfaTokenPayload;
      if (payload.purpose !== 'mfa_verification') {
        throw new UnauthorizedError('Invalid MFA token');
      }
      return payload;
    } catch {
      throw new UnauthorizedError('MFA token expired or invalid');
    }
  }

  private generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const bytes = randomBytes(6); // 12 hex chars
      const hex = bytes.toString('hex').toUpperCase();
      // Format: XXXX-XXXX-XXXX
      codes.push(`${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`);
    }
    return codes;
  }

  private async issueFullTokens(
    user: IUser,
    tenantId: string
  ): Promise<AuthResponse> {
    const redis = getRedisClient();

    const accessToken = jwt.sign(
      {
        userId: user.id,
        tenantId,
        email: user.email,
        role: user.role,
      },
      config.JWT_ACCESS_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
    );

    const refreshPayload = {
      userId: user.id,
      tenantId,
      tokenFamily: randomUUID(),
    };
    const refreshToken = jwt.sign(
      refreshPayload,
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );

    const ttlSeconds = 7 * 24 * 60 * 60; // 7 days
    await redis.setex(`refresh:${user.id}`, ttlSeconds, refreshToken);

    return {
      user: {
        _id: user.id as string,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId,
      },
      accessToken,
      refreshToken,
    };
  }
}
