import { Request, Response } from 'express';
import { IntegrationService } from './integration.service';
import { INTEGRATION_PROVIDERS } from './providers';
import {
  integrationListSchema,
  integrationProviderParamSchema,
  integrationIdParamSchema,
  integrationConnectSchema,
  integrationUpdateSchema,
  connectionIdParamSchema,
  providerIdParamSchema,
  oauthCallbackSchema,
  eventQuerySchema,
  integrationUpdateConfigSchema,
} from '@api/validators/integration.validator';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('IntegrationController');
const integrationService = new IntegrationService();

export const integrationController = {
  // ── New frontend-aligned endpoints ────────────────────────

  async listProviders(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: INTEGRATION_PROVIDERS });
  },

  async listConnections(_req: Request, res: Response): Promise<void> {
    const connections = await integrationService.listConnections();
    res.json({ success: true, data: connections });
  },

  async getConnectionEvents(req: Request, res: Response): Promise<void> {
    const { connectionId } = connectionIdParamSchema.parse(req.params);
    const { cursor, limit } = eventQuerySchema.parse(req.query);
    const result = await integrationService.getConnectionEvents(connectionId, {
      cursor,
      limit,
    });
    res.json({ success: true, data: result.data, nextCursor: result.nextCursor, total: result.total });
  },

  async connectProvider(req: Request, res: Response): Promise<void> {
    const { providerId } = providerIdParamSchema.parse(req.params);
    const body = integrationConnectSchema.safeParse(req.body);

    // Frontend may send empty body for OAuth providers (just POST /:providerId/connect)
    const input = body.success
      ? body.data
      : { name: providerId, config: {}, enabledEvents: ['task.created'] };

    const result = await integrationService.connect(providerId, input);
    res.status(201).json({ success: true, data: result });
  },

  async completeOAuth(req: Request, res: Response): Promise<void> {
    const { providerId } = providerIdParamSchema.parse(req.params);
    const { code, state } = oauthCallbackSchema.parse(req.body);
    const connection = await integrationService.completeOAuth(providerId, code, state);
    res.json({ success: true, data: connection });
  },

  async updateConnectionConfig(req: Request, res: Response): Promise<void> {
    const { connectionId } = connectionIdParamSchema.parse(req.params);
    const input = integrationUpdateConfigSchema.parse(req.body);
    const connection = await integrationService.updateConfig(connectionId, input);
    res.json({ success: true, data: connection });
  },

  async disconnectConnection(req: Request, res: Response): Promise<void> {
    const { connectionId } = connectionIdParamSchema.parse(req.params);
    await integrationService.disconnect(connectionId);
    res.json({ success: true, message: 'Integration disconnected' });
  },

  async testConnectionHealth(req: Request, res: Response): Promise<void> {
    const { connectionId } = connectionIdParamSchema.parse(req.params);
    const result = await integrationService.testConnection(connectionId);
    res.json({ success: true, data: result });
  },

  // ── Legacy endpoints (backward compatibility) ─────────────

  async list(req: Request, res: Response): Promise<void> {
    const filters = integrationListSchema.parse(req.query);
    const integrations = await integrationService.list(filters);
    res.json({ success: true, data: integrations });
  },

  async connect(req: Request, res: Response): Promise<void> {
    const { provider } = integrationProviderParamSchema.parse(req.params);
    const input = integrationConnectSchema.parse(req.body);
    const result = await integrationService.connect(provider, input);
    res.status(201).json({ success: true, data: result });
  },

  async updateConfig(req: Request, res: Response): Promise<void> {
    const { id } = integrationIdParamSchema.parse(req.params);
    const input = integrationUpdateSchema.parse(req.body);
    const integration = await integrationService.updateConfigLegacy(id, input);
    res.json({ success: true, data: integration });
  },

  async disconnect(req: Request, res: Response): Promise<void> {
    const { id } = integrationIdParamSchema.parse(req.params);
    await integrationService.disconnect(id);
    res.json({ success: true, message: 'Integration disconnected' });
  },

  async testConnection(req: Request, res: Response): Promise<void> {
    const { id } = integrationIdParamSchema.parse(req.params);
    const result = await integrationService.testConnection(id);
    res.json({ success: true, data: result });
  },

  async handleInboundWebhook(req: Request, res: Response): Promise<void> {
    const { provider } = integrationProviderParamSchema.parse(req.params);
    const adapter = integrationService.getAdapter(provider);

    const signatureHeaders: Record<string, string> = {
      slack: 'x-slack-signature',
      github: 'x-hub-signature-256',
      jira: 'x-atlassian-webhook-identifier',
    };
    const signatureHeader = signatureHeaders[provider];
    const signature = (req.headers[signatureHeader] as string) ?? '';

    const rawBody =
      (req as Request & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(req.body));

    const webhookSecret = req.headers['x-webhook-secret'] as string | undefined;
    if (webhookSecret) {
      const integration =
        await integrationService.findByWebhookSecret(webhookSecret);
      if (!integration || integration.provider !== provider) {
        res
          .status(401)
          .json({ success: false, message: 'Invalid webhook secret' });
        return;
      }

      const isValid = adapter.verifySignature(
        rawBody,
        signature,
        integration.webhookSecret
      );
      if (!isValid && signature) {
        log.warn({ provider }, 'Invalid inbound webhook signature');
        res
          .status(401)
          .json({ success: false, message: 'Invalid signature' });
        return;
      }
    }

    const result = adapter.parseInboundWebhook(
      req.body,
      req.headers as Record<string, string>
    );

    if (result.action !== 'ignore') {
      log.info(
        { provider, action: result.action },
        'Inbound webhook processed'
      );
    }

    res.json({ success: true });
  },

  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    const { provider } = integrationProviderParamSchema.parse(req.params);
    const frontendUrl =
      process.env['FRONTEND_URL'] ?? 'http://localhost:5171';
    const redirectUrl = `${frontendUrl}/settings/integrations?provider=${provider}&status=connected`;
    res.redirect(redirectUrl);
  },
};
