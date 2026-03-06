import { IOAuthProvider, OAuthProviderConfig } from './base.provider';
import { OAuthUserProfile, OAuthTokens } from '../../auth.types';

const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MS_GRAPH_URL = 'https://graph.microsoft.com/v1.0/me';

export class MicrosoftProvider implements IOAuthProvider {
  readonly name = 'microsoft';
  private config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile User.Read',
      state,
      response_mode: 'query',
    });
    return `${MS_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri?: string): Promise<OAuthTokens> {
    const response = await fetch(MS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri ?? this.config.callbackUrl,
        grant_type: 'authorization_code',
        scope: 'openid email profile User.Read',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Microsoft token exchange failed: ${errorBody}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const response = await fetch(MS_GRAPH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to fetch Microsoft user profile');

    const data = (await response.json()) as {
      id: string;
      displayName: string;
      mail: string | null;
      userPrincipalName: string;
    };

    return {
      providerUserId: data.id,
      email: data.mail ?? data.userPrincipalName,
      displayName: data.displayName,
      avatarUrl: null, // Microsoft Graph photo requires separate request
      raw: data as unknown as Record<string, unknown>,
    };
  }
}
