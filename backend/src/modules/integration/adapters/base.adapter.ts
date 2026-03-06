import { IIntegration } from '../integration.model';

export interface OutboundPayload {
  event: string;
  data: Record<string, unknown>;
  tenantId: string;
  timestamp: string;
}

export interface InboundResult {
  action: 'task.create' | 'task.update' | 'task.link' | 'ignore';
  data?: Record<string, unknown>;
}

export interface IntegrationAdapter {
  /** Provider name matching IntegrationProvider type */
  readonly provider: string;

  /** Push a domain event to the external service */
  pushEvent(integration: IIntegration, payload: OutboundPayload): Promise<void>;

  /** Validate inbound webhook signature */
  verifySignature(rawBody: Buffer, signature: string, secret: string): boolean;

  /** Parse inbound webhook into internal action */
  parseInboundWebhook(body: unknown, headers: Record<string, string>): InboundResult;

  /** Test connectivity (used for health checks) */
  testConnection(integration: IIntegration): Promise<{ ok: boolean; error?: string }>;
}
