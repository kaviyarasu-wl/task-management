export interface AdminLoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface SafeSuperAdmin {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isMfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginResponse {
  admin: SafeSuperAdmin;
  accessToken: string;
  refreshToken: string;
}
