export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}
