import type { User } from '@/shared/types/entities.types';

export type OAuthProvider = 'google' | 'github' | 'microsoft';

export interface OAuthUrlResponse {
  url: string;
  state: string;
}

export interface OAuthCallbackData {
  code: string;
  state: string;
}

export interface OAuthCallbackResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface LinkedProvider {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  linkedAt: string;
}

export interface OAuthError {
  code:
    | 'OAUTH_DENIED'
    | 'ACCOUNT_ALREADY_LINKED'
    | 'EMAIL_MISMATCH'
    | 'PROVIDER_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
}
