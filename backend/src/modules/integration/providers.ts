export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'toggle';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  helpText?: string;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  category: 'communication' | 'development' | 'project_management' | 'productivity';
  authType: 'oauth' | 'api_key' | 'webhook';
  configFields: ConfigField[];
  isAvailable: boolean;
}

export const INTEGRATION_PROVIDERS: ProviderMetadata[] = [
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Send task notifications and updates to Slack channels. Create tasks from Slack commands.',
    logoUrl: '/integrations/slack.svg',
    category: 'communication',
    authType: 'webhook',
    configFields: [
      {
        key: 'channel',
        label: 'Channel',
        type: 'text',
        required: true,
        placeholder: '#general',
        helpText: 'The Slack channel to post notifications to',
      },
      {
        key: 'notifyOnTaskCreate',
        label: 'Notify on task creation',
        type: 'toggle',
        required: false,
        helpText: 'Post a message when a new task is created',
      },
      {
        key: 'notifyOnTaskComplete',
        label: 'Notify on task completion',
        type: 'toggle',
        required: false,
        helpText: 'Post a message when a task is completed',
      },
      {
        key: 'notifyOnComment',
        label: 'Notify on comments',
        type: 'toggle',
        required: false,
        helpText: 'Post a message when a comment is added',
      },
    ],
    isAvailable: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description:
      'Sync issues and pull requests with tasks. Auto-link commits to tasks.',
    logoUrl: '/integrations/github.svg',
    category: 'development',
    authType: 'oauth',
    configFields: [
      {
        key: 'repository',
        label: 'Repository',
        type: 'text',
        required: true,
        placeholder: 'owner/repo',
        helpText: 'GitHub repository in owner/repo format',
      },
      {
        key: 'syncIssues',
        label: 'Sync issues',
        type: 'toggle',
        required: false,
        helpText: 'Create tasks from new GitHub issues',
      },
      {
        key: 'syncPullRequests',
        label: 'Sync pull requests',
        type: 'toggle',
        required: false,
        helpText: 'Link pull requests to tasks',
      },
      {
        key: 'autoLink',
        label: 'Auto-link commits',
        type: 'toggle',
        required: false,
        helpText: 'Automatically link commits mentioning task IDs',
      },
    ],
    isAvailable: true,
  },
  {
    id: 'jira',
    name: 'Jira',
    description:
      'Bidirectional sync between Jira issues and tasks. Map statuses and priorities.',
    logoUrl: '/integrations/jira.svg',
    category: 'project_management',
    authType: 'oauth',
    configFields: [
      {
        key: 'projectKey',
        label: 'Project key',
        type: 'text',
        required: true,
        placeholder: 'PROJ',
        helpText: 'The Jira project key to sync with',
      },
      {
        key: 'syncDirection',
        label: 'Sync direction',
        type: 'select',
        required: true,
        options: [
          { value: 'inbound', label: 'Jira -> TaskSaaS' },
          { value: 'outbound', label: 'TaskSaaS -> Jira' },
          { value: 'bidirectional', label: 'Bidirectional' },
        ],
        helpText: 'Which direction to sync data',
      },
      {
        key: 'mapStatuses',
        label: 'Map statuses',
        type: 'toggle',
        required: false,
        helpText: 'Automatically map Jira statuses to task statuses',
      },
    ],
    isAvailable: true,
  },
  {
    id: 'linear',
    name: 'Linear',
    description:
      'Sync Linear issues with tasks for seamless project tracking.',
    logoUrl: '/integrations/linear.svg',
    category: 'project_management',
    authType: 'oauth',
    configFields: [],
    isAvailable: false,
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Get task notifications in Discord channels via webhook.',
    logoUrl: '/integrations/discord.svg',
    category: 'communication',
    authType: 'webhook',
    configFields: [],
    isAvailable: false,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync task due dates with Google Calendar events.',
    logoUrl: '/integrations/google-calendar.svg',
    category: 'productivity',
    authType: 'oauth',
    configFields: [],
    isAvailable: false,
  },
];
