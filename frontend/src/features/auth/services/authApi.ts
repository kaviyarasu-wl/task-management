import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { User } from '@/shared/types/entities.types';
import type {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  AuthTokens,
} from '../types/auth.types';
import type {
  MFASetupResponse,
  MFAVerifySetupResponse,
  MFAVerifyResponse,
} from '../types/mfa.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return data;
  },

  register: async (userData: RegisterData): Promise<ApiResponse<RegisterResponse>> => {
    const { data } = await api.post<ApiResponse<RegisterResponse>>('/auth/register', userData);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
    const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data;
  },

  // MFA endpoints
  mfaSetup: async (): Promise<ApiResponse<MFASetupResponse>> => {
    const { data } = await api.post<ApiResponse<MFASetupResponse>>('/auth/mfa/setup');
    return data;
  },

  mfaVerifySetup: async (code: string): Promise<ApiResponse<MFAVerifySetupResponse>> => {
    const { data } = await api.post<ApiResponse<MFAVerifySetupResponse>>(
      '/auth/mfa/verify-setup',
      { code }
    );
    return data;
  },

  mfaVerify: async (
    mfaToken: string,
    code: string
  ): Promise<ApiResponse<MFAVerifyResponse>> => {
    const { data } = await api.post<ApiResponse<MFAVerifyResponse>>('/auth/mfa/verify', {
      mfaToken,
      code,
    });
    return data;
  },

  mfaDisable: async (code: string): Promise<ApiResponse<null>> => {
    const { data } = await api.post<ApiResponse<null>>('/auth/mfa/disable', { code });
    return data;
  },

  mfaRecovery: async (
    mfaToken: string,
    recoveryCode: string
  ): Promise<ApiResponse<MFAVerifyResponse>> => {
    const { data } = await api.post<ApiResponse<MFAVerifyResponse>>('/auth/mfa/recovery', {
      mfaToken,
      recoveryCode,
    });
    return data;
  },
};
