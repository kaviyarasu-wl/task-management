import { IOAuthProvider, OAuthProviderConfig } from './base.provider';
import { OAuthUserProfile, OAuthTokens } from '../../auth.types';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

export class GitHubProvider implements IOAuthProvider {
  readonly name = 'github';
  private config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: 'read:user user:email',
      state,
    });
    return `${GITHUB_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri?: string): Promise<OAuthTokens> {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri ?? this.config.callbackUrl,
      }),
    });

    const data = (await response.json()) as {
      access_token: string;
      error?: string;
    };

    if (data.error) throw new Error(`GitHub token exchange failed: ${data.error}`);

    return { accessToken: data.access_token };
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    };

    const [userResponse, emailsResponse] = await Promise.all([
      fetch(GITHUB_USER_URL, { headers }),
      fetch(GITHUB_EMAILS_URL, { headers }),
    ]);

    if (!userResponse.ok) throw new Error('Failed to fetch GitHub user profile');

    const user = (await userResponse.json()) as {
      id: number;
      name: string | null;
      avatar_url: string;
      email: string | null;
    };

    // GitHub may not return email on profile — fetch from emails endpoint
    let email = user.email;
    if (!email && emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primaryEmail = emails.find((e) => e.primary && e.verified);
      email = primaryEmail?.email ?? emails[0]?.email ?? null;
    }

    if (!email) throw new Error('No verified email found on GitHub account');

    return {
      providerUserId: String(user.id),
      email,
      displayName: user.name,
      avatarUrl: user.avatar_url,
      raw: user as unknown as Record<string, unknown>,
    };
  }
}
