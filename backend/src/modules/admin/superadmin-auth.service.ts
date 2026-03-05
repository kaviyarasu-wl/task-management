import { SuperAdmin, ISuperAdmin } from './models/superadmin.model';
import {
  generateAdminToken,
  generateAdminRefreshToken,
  verifyAdminRefreshToken,
} from '@api/middleware/superadmin.middleware';
import { UnauthorizedError, BadRequestError, NotFoundError } from '@core/errors/AppError';
import bcrypt from 'bcryptjs';
import { CreateSuperAdminInput } from './admin.validator';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface SafeSuperAdmin {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isMfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResult {
  admin: SafeSuperAdmin;
  accessToken: string;
  refreshToken: string;
}

export class SuperAdminAuthService {
  /**
   * Authenticate superadmin with email and password
   */
  async login(email: string, password: string, mfaCode?: string): Promise<LoginResult> {
    // Find admin with password field included
    const admin = await SuperAdmin.findOne({ email }).select('+passwordHash +mfaSecret');

    if (!admin) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is locked
    if (admin.isLocked()) {
      const remainingMs = admin.lockedUntil!.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedError(`Account locked. Try again in ${remainingMin} minutes.`);
    }

    // Check if account is active
    if (!admin.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isValid = await admin.comparePassword(password);

    if (!isValid) {
      // Increment failed attempts
      admin.failedLoginAttempts += 1;

      if (admin.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        admin.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }

      await admin.save();
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check MFA if enabled
    if (admin.isMfaEnabled) {
      if (!mfaCode) {
        throw new BadRequestError('MFA code required');
      }

      // TODO: Implement MFA verification using speakeasy or similar
      // const isValidMfa = speakeasy.totp.verify({
      //   secret: admin.mfaSecret!,
      //   encoding: 'base32',
      //   token: mfaCode,
      // });
      //
      // if (!isValidMfa) {
      //   throw new UnauthorizedError('Invalid MFA code');
      // }
    }

    // Reset failed attempts and update last login
    admin.failedLoginAttempts = 0;
    admin.lockedUntil = undefined;
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate tokens
    const accessToken = generateAdminToken({
      superAdminId: admin._id.toString(),
      email: admin.email,
    });

    const refreshToken = generateAdminRefreshToken(admin._id.toString());

    // Return sanitized admin object
    const safeAdmin = this.sanitizeAdmin(admin);

    return {
      admin: safeAdmin,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = verifyAdminRefreshToken(refreshToken);

      const admin = await SuperAdmin.findById(payload.superAdminId);

      if (!admin || !admin.isActive) {
        throw new UnauthorizedError('Admin not found or inactive');
      }

      const accessToken = generateAdminToken({
        superAdminId: admin._id.toString(),
        email: admin.email,
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Get current admin profile
   */
  async getProfile(superAdminId: string): Promise<SafeSuperAdmin> {
    const admin = await SuperAdmin.findById(superAdminId);

    if (!admin) {
      throw new NotFoundError('Admin');
    }

    return this.sanitizeAdmin(admin);
  }

  /**
   * Create new superadmin (for seeding/setup)
   */
  async createAdmin(data: CreateSuperAdminInput): Promise<SafeSuperAdmin> {
    const existing = await SuperAdmin.findOne({ email: data.email });

    if (existing) {
      throw new BadRequestError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const admin = new SuperAdmin({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    await admin.save();

    return this.sanitizeAdmin(admin);
  }

  /**
   * Remove sensitive fields from admin object
   */
  private sanitizeAdmin(admin: ISuperAdmin): SafeSuperAdmin {
    return {
      _id: admin._id.toString(),
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      isActive: admin.isActive,
      isMfaEnabled: admin.isMfaEnabled,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
