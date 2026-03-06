import { OAuthUserProfile, OAuthTokens } from '../../auth.types';

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface IOAuthProvider {
  /** Provider name: 'google' | 'github' | 'microsoft' */
  readonly name: string;

  /** Build the authorization URL to redirect user to */
  getAuthorizationUrl(state: string): string;

  /** Exchange authorization code for tokens */
  exchangeCode(code: string, redirectUri?: string): Promise<OAuthTokens>;

  /** Fetch user profile using access token */
  getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
}
