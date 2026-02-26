import { UserRole } from '../../types';

export interface JwtAccessPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
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
