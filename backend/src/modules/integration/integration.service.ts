import crypto from 'crypto';
import { Types } from 'mongoose';
import { IntegrationRepository, IntegrationFilters } from './integration.repository';
import { IIntegration, IntegrationProvider, IntegrationStatus } from './integration.model';
import { IntegrationEventRepository, IntegrationEventPagination, PaginatedIntegrationEvents } from './integrationEvent.repository';
import { RequestContext } from '@core/context/RequestContext';
import { ForbiddenError, NotFoundError, BadRequestError } from '@core/errors/AppError';
import { encryptConfig, decryptConfig } from './crypto';
import { IntegrationAdapter } from './adapters/base.adapter';
import { SlackAdapter } from './adapters/slack.adapter';
import { GitHubAdapter } from './adapters/github.adapter';
import { JiraAdapter } from './adapters/jira.adapter';
import { integrationQueue } from '@infrastructure/queue/queues';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('IntegrationService');

const SENSITIVE_KEYS = new Set([
  'accesstoken', 'webhookurl', 'apikey', 'secret', 'password', 'token',
  'clientsecret', 'refreshtoken', 'privatekey',
]);

export interface IntegrationConnectionResponse {
  _id: string;
  tenantId: string;
  providerId: string;
  status: string;
  config: Record<string, unknown>;
  connectedBy: string;
  connectedAt: string;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectProviderResponse {
  redirectUrl?: string;
  connection?: IntegrationConnectionResponse;
}

function maskSensitiveConfig(config: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      masked[key] = '••••••••';
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function toConnectionResponse(integration: IIntegration): IntegrationConnectionResponse {
  let config: Record<string, unknown> = {};
  try {
    config = maskSensitiveConfig(decryptConfig(integration.config));
  } catch {
    log.warn({ integrationId: integration._id }, 'Failed to decrypt integration config');
  }

  return {
    _id: integration._id!.toString(),
    tenantId: integration.tenantId,
    providerId: integration.provider,
    status: integration.status,
    config,
    connectedBy: integration.createdBy.toString(),
    connectedAt: integration.createdAt.toISOString(),
    lastSyncAt: integration.lastSyncAt?.toISOString(),
    errorMessage: integration.lastError,
    createdAt: integration.createdAt.toISOString(),
    updatedAt: integration.updatedAt.toISOString(),
  };
}

export class IntegrationService {
  private integrationRepo: IntegrationRepository;
  private eventRepo: IntegrationEventRepository;
  private adapters: Map<string, IntegrationAdapter>;

  constructor() {
    this.integrationRepo = new IntegrationRepository();
    this.eventRepo = new IntegrationEventRepository();
    this.adapters = new Map<string, IntegrationAdapter>([
      ['slack', new SlackAdapter()],
      ['github', new GitHubAdapter()],
      ['jira', new JiraAdapter()],
    ]);
  }

  getAdapter(provider: string): IntegrationAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new BadRequestError(`Unsupported provider: ${provider}`);
    return adapter;
  }

  async list(filters: IntegrationFilters): Promise<IIntegration[]> {
    const { tenantId } = RequestContext.get();
    return this.integrationRepo.findAll(tenantId, filters);
  }

  async listConnections(): Promise<IntegrationConnectionResponse[]> {
    const { tenantId } = RequestContext.get();
    const integrations = await this.integrationRepo.findAll(tenantId, {});
    return integrations.map(toConnectionResponse);
  }

  async connect(
    provider: IntegrationProvider,
    data: { name: string; config: Record<string, unknown>; enabledEvents: string[] }
  ): Promise<ConnectProviderResponse> {
    const { tenantId, userId, role } = RequestContext.get();

    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenError('Only admins can manage integrations');
    }

    // For OAuth providers without config, return redirect URL
    const oauthProviders = new Set(['github', 'jira']);
    if (oauthProviders.has(provider) && !data.config.accessToken) {
      // Generate a signed state param for the OAuth flow
      const state = Buffer.from(
        JSON.stringify({ tenantId, userId, provider, ts: Date.now() })
      ).toString('base64url');

      const redirectUrls: Record<string, string> = {
        github: `https://github.com/login/oauth/authorize?client_id=${process.env['GITHUB_APP_ID'] ?? ''}&state=${state}&scope=repo`,
        jira: `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env['JIRA_CLIENT_ID'] ?? ''}&scope=read%3Ajira-work%20write%3Ajira-work&redirect_uri=${encodeURIComponent(process.env['FRONTEND_URL'] ?? 'http://localhost:5171')}/settings/integrations/callback&state=${state}&response_type=code&prompt=consent`,
      };

      const redirectUrl = redirectUrls[provider];
      if (redirectUrl) {
        return { redirectUrl };
      }
    }

    const webhookSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const encryptedConfig = encryptConfig(data.config);

    const integration = await this.integrationRepo.create({
      tenantId,
      provider,
      name: data.name,
      config: encryptedConfig,
      webhookSecret,
      enabledEvents: data.enabledEvents,
      createdBy: new Types.ObjectId(userId),
    });

    return { connection: toConnectionResponse(integration) };
  }

  async completeOAuth(
    providerId: IntegrationProvider,
    code: string,
    state: string
  ): Promise<IntegrationConnectionResponse> {
    // Decode state to extract tenant and user info
    let stateData: { tenantId: string; userId: string; provider: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      throw new BadRequestError('Invalid OAuth state parameter');
    }

    if (stateData.provider !== providerId) {
      throw new BadRequestError('Provider mismatch in OAuth state');
    }

    // In a production system, exchange the code for an access token via the provider's API.
    // For now, create the integration with the code as a placeholder.
    const webhookSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const encryptedConfig = encryptConfig({
      oauthCode: code,
      connectedVia: 'oauth',
    });

    const integration = await this.integrationRepo.create({
      tenantId: stateData.tenantId,
      provider: providerId,
      name: `${providerId.charAt(0).toUpperCase() + providerId.slice(1)} Integration`,
      config: encryptedConfig,
      webhookSecret,
      enabledEvents: [],
      createdBy: new Types.ObjectId(stateData.userId),
    });

    return toConnectionResponse(integration);
  }

  async updateConfig(
    connectionId: string,
    data: { config: Record<string, unknown> }
  ): Promise<IntegrationConnectionResponse> {
    const { tenantId, role } = RequestContext.get();

    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenError('Only admins can manage integrations');
    }

    const existing = await this.integrationRepo.findById(tenantId, connectionId);
    if (!existing) throw new NotFoundError('Integration');

    // Merge new config with existing decrypted config
    let existingConfig: Record<string, unknown> = {};
    try {
      existingConfig = decryptConfig(existing.config);
    } catch {
      log.warn({ connectionId }, 'Failed to decrypt existing config during update');
    }

    const mergedConfig = { ...existingConfig, ...data.config };
    const encryptedConfig = encryptConfig(mergedConfig);

    const updated = await this.integrationRepo.update(tenantId, connectionId, {
      config: encryptedConfig,
    });
    if (!updated) throw new NotFoundError('Integration');

    return toConnectionResponse(updated);
  }

  async updateConfigLegacy(
    integrationId: string,
    data: { name?: string; enabledEvents?: string[]; status?: IntegrationStatus }
  ): Promise<IIntegration> {
    const { tenantId, role } = RequestContext.get();

    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenError('Only admins can manage integrations');
    }

    const existing = await this.integrationRepo.findById(tenantId, integrationId);
    if (!existing) throw new NotFoundError('Integration');

    const updated = await this.integrationRepo.update(tenantId, integrationId, data);
    if (!updated) throw new NotFoundError('Integration');

    return updated;
  }

  async disconnect(connectionId: string): Promise<void> {
    const { tenantId, role } = RequestContext.get();

    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenError('Only admins can manage integrations');
    }

    const integration = await this.integrationRepo.findById(tenantId, connectionId);
    if (!integration) throw new NotFoundError('Integration');

    await this.integrationRepo.softDelete(tenantId, connectionId);
  }

  async testConnection(connectionId: string): Promise<{ ok: boolean; error?: string }> {
    const { tenantId } = RequestContext.get();

    const integration = await this.integrationRepo.findById(tenantId, connectionId);
    if (!integration) throw new NotFoundError('Integration');

    const adapter = this.getAdapter(integration.provider);
    return adapter.testConnection(integration);
  }

  async findByWebhookSecret(webhookSecret: string): Promise<IIntegration | null> {
    return this.integrationRepo.findByWebhookSecret(webhookSecret);
  }

  async getConnectionEvents(
    connectionId: string,
    pagination: IntegrationEventPagination
  ): Promise<PaginatedIntegrationEvents> {
    const { tenantId } = RequestContext.get();

    // Verify the connection belongs to this tenant
    const integration = await this.integrationRepo.findById(tenantId, connectionId);
    if (!integration) throw new NotFoundError('Integration');

    return this.eventRepo.findByConnectionId(tenantId, connectionId, pagination);
  }

  async logEvent(data: {
    tenantId: string;
    connectionId: string;
    eventType: string;
    direction: 'inbound' | 'outbound';
    status: 'success' | 'failed';
    payload?: Record<string, unknown>;
    responseCode?: number;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.eventRepo.create({
        ...data,
        connectionId: new Types.ObjectId(data.connectionId),
      });
    } catch (error) {
      log.error({ err: error, connectionId: data.connectionId }, 'Failed to log integration event');
    }
  }

  async queueOutboundPush(
    event: string,
    payload: Record<string, unknown>,
    tenantId: string
  ): Promise<void> {
    const integrations = await this.integrationRepo.findByEvent(tenantId, event);

    for (const integration of integrations) {
      await integrationQueue.add('push', {
        integrationId: integration._id!.toString(),
        event,
        payload,
        tenantId,
      });
    }
  }
}
