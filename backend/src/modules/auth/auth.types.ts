import { UserRole } from '../../types';

// OAuth types
export type OAuthProvider = 'google' | 'github' | 'microsoft';

export interface OAuthUserProfile {
  providerUserId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  raw: Record<string, unknown>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface JwtAccessPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  /** Role permissions loaded from Role collection. Present after role migration. */
  rolePermissions?: string[];
  /** User's preferred locale for i18n */
  locale?: string;
}

export interface JwtRefreshPayload {
  userId: string;
  tenantId: string;
  tokenFamily: string; // Rotation detection: each refresh issues a new family ID
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string; // Creates a new tenant on register
}

export interface LoginInput {
  email: string;
  password: string;
  tenantSlug: string; // Must specify which org you're logging into
}

// MFA types

export interface MfaLoginResponse {
  requiresMfa: true;
  mfaToken: string; // Short-lived JWT (5 minutes) containing userId + tenantId
}

export interface MfaTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  purpose: 'mfa_verification';
}
