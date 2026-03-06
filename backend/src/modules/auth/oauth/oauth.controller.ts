import { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import {
  oauthProviderParamSchema,
  oauthRedirectQuerySchema,
  oauthCallbackQuerySchema,
  oauthLinkBodySchema,
} from '@api/validators/oauth.validator';
import { config } from '../../../config';

const oauthService = new OAuthService();

export const oauthController = {
  async redirect(req: Request, res: Response): Promise<void> {
    const { provider } = oauthProviderParamSchema.parse(req.params);
    const query = oauthRedirectQuerySchema.parse(req.query);

    const url = await oauthService.getRedirectUrl(provider, query);
    res.redirect(url);
  },

  async callback(req: Request, res: Response): Promise<void> {
    const { provider } = oauthProviderParamSchema.parse(req.params);
    const { code, state } = oauthCallbackQuerySchema.parse(req.query);

    try {
      const { tokens, isNewUser } = await oauthService.handleCallback(provider, code, state);
      const frontendUrl = config.FRONTEND_URL;
      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isNewUser: String(isNewUser),
      });
      res.redirect(`${frontendUrl}/oauth/callback#${params.toString()}`);
    } catch (err) {
      const frontendUrl = config.FRONTEND_URL;
      const message = err instanceof Error ? err.message : 'OAuth login failed';
      res.redirect(`${frontendUrl}/oauth/callback#error=${encodeURIComponent(message)}`);
    }
  },

  async linkAccount(req: Request, res: Response): Promise<void> {
    const { provider } = oauthProviderParamSchema.parse(req.params);
    const { code, redirectUri } = oauthLinkBodySchema.parse(req.body);

    const result = await oauthService.linkAccount(provider, code, redirectUri);
    res.json({ success: true, data: result });
  },

  async unlinkAccount(req: Request, res: Response): Promise<void> {
    const { provider } = oauthProviderParamSchema.parse(req.params);
    await oauthService.unlinkAccount(provider);
    res.json({
      success: true,
      data: { message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked` },
    });
  },

  async listLinkedAccounts(_req: Request, res: Response): Promise<void> {
    const accounts = await oauthService.getLinkedAccounts();
    res.json({ success: true, data: accounts });
  },
};
