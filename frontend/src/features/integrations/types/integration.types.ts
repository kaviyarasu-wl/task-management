export type ConnectionStatus = 'active' | 'inactive' | 'error' | 'pending';

export type IntegrationProviderId =
  | 'slack'
  | 'github'
  | 'jira'
  | 'linear'
  | 'discord'
  | 'google_calendar';

export interface IntegrationProvider {
  id: IntegrationProviderId;
  name: string;
  description: string;
  logoUrl: string;
  category: 'communication' | 'development' | 'project_management' | 'productivity';
  authType: 'oauth' | 'api_key' | 'webhook';
  configFields: ConfigField[];
  isAvailable: boolean;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'toggle';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  helpText?: string;
}

export interface IntegrationConnection {
  _id: string;
  tenantId: string;
  providerId: IntegrationProviderId;
  status: ConnectionStatus;
  config: Record<string, unknown>;
  connectedBy: string;
  connectedAt: string;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationEvent {
  _id: string;
  connectionId: string;
  eventType: string;
  direction: 'inbound' | 'outbound';
  status: 'success' | 'failed';
  payload?: Record<string, unknown>;
  responseCode?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface ConnectProviderResponse {
  redirectUrl?: string;
  connection?: IntegrationConnection;
}

export const PROVIDER_LOGOS: Record<IntegrationProviderId, string> = {
  slack: '/integrations/slack.svg',
  github: '/integrations/github.svg',
  jira: '/integrations/jira.svg',
  linear: '/integrations/linear.svg',
  discord: '/integrations/discord.svg',
  google_calendar: '/integrations/google-calendar.svg',
};
