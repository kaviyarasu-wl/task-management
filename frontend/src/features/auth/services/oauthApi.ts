import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  OAuthProvider,
  OAuthUrlResponse,
  OAuthCallbackData,
  OAuthCallbackResponse,
  LinkedProvider,
} from '../types/oauth.types';

export const oauthApi = {
  /** Get OAuth authorization URL for a provider */
  getAuthUrl: async (
    provider: OAuthProvider
  ): Promise<ApiResponse<OAuthUrlResponse>> => {
    const { data } = await api.get<ApiResponse<OAuthUrlResponse>>(
      `/auth/oauth/${provider}`
    );
    return data;
  },

  /** Exchange authorization code for tokens */
  callback: async (
    provider: OAuthProvider,
    callbackData: OAuthCallbackData
  ): Promise<ApiResponse<OAuthCallbackResponse>> => {
    const { data } = await api.post<ApiResponse<OAuthCallbackResponse>>(
      `/auth/oauth/${provider}/callback`,
      callbackData
    );
    return data;
  },

  /** List linked OAuth providers for the current user */
  getLinkedProviders: async (): Promise<ApiResponse<LinkedProvider[]>> => {
    const { data } = await api.get<ApiResponse<LinkedProvider[]>>(
      '/auth/oauth/accounts'
    );
    return data;
  },

  /** Link an OAuth provider to the current account */
  linkProvider: async (
    provider: OAuthProvider
  ): Promise<ApiResponse<OAuthUrlResponse>> => {
    const { data } = await api.post<ApiResponse<OAuthUrlResponse>>(
      `/auth/oauth/${provider}/link`
    );
    return data;
  },

  /** Unlink an OAuth provider from the current account */
  unlinkProvider: async (
    provider: OAuthProvider
  ): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(
      `/auth/oauth/${provider}/unlink`
    );
    return data;
  },
};
