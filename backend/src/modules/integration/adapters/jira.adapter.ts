import crypto from 'crypto';
import { IntegrationAdapter, OutboundPayload, InboundResult } from './base.adapter';
import { IIntegration } from '../integration.model';
import { decryptConfig } from '../crypto';

export class JiraAdapter implements IntegrationAdapter {
  readonly provider = 'jira';

  async pushEvent(integration: IIntegration, payload: OutboundPayload): Promise<void> {
    const integrationConfig = decryptConfig(integration.config) as {
      siteUrl: string;
      email: string;
      apiToken: string;
      projectKey: string;
    };

    const jiraPayload = this.formatJiraIssue(payload, integrationConfig.projectKey);

    const authHeader = Buffer.from(
      `${integrationConfig.email}:${integrationConfig.apiToken}`
    ).toString('base64');

    const response = await fetch(
      `${integrationConfig.siteUrl}/rest/api/3/issue`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jiraPayload),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Jira API failed: HTTP ${response.status} - ${errorBody.substring(0, 500)}`);
    }
  }

  verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
    // Jira uses HMAC-SHA256 with the webhook secret
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature.length !== computed.length) return false;

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  }

  parseInboundWebhook(body: unknown, _headers: Record<string, string>): InboundResult {
    const jiraBody = body as {
      webhookEvent?: string;
      issue?: {
        key?: string;
        fields?: {
          summary?: string;
          description?: string;
          status?: { name?: string };
        };
        self?: string;
      };
    };

    // Issue created -> create task
    if (jiraBody.webhookEvent === 'jira:issue_created' && jiraBody.issue) {
      return {
        action: 'task.create',
        data: {
          title: jiraBody.issue.fields?.summary ?? 'Untitled Jira Issue',
          description: jiraBody.issue.fields?.description ?? '',
          externalId: `jira:${jiraBody.issue.key}`,
          externalUrl: jiraBody.issue.self,
        },
      };
    }

    // Issue updated -> update task
    if (jiraBody.webhookEvent === 'jira:issue_updated' && jiraBody.issue) {
      const isDone = jiraBody.issue.fields?.status?.name?.toLowerCase() === 'done';
      return {
        action: 'task.update',
        data: {
          externalId: `jira:${jiraBody.issue.key}`,
          title: jiraBody.issue.fields?.summary,
          ...(isDone && { status: 'completed' }),
        },
      };
    }

    return { action: 'ignore' };
  }

  async testConnection(integration: IIntegration): Promise<{ ok: boolean; error?: string }> {
    try {
      const integrationConfig = decryptConfig(integration.config) as {
        siteUrl: string;
        email: string;
        apiToken: string;
      };

      const authHeader = Buffer.from(
        `${integrationConfig.email}:${integrationConfig.apiToken}`
      ).toString('base64');

      const response = await fetch(
        `${integrationConfig.siteUrl}/rest/api/3/myself`,
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Accept': 'application/json',
          },
        }
      );

      return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private formatJiraIssue(
    payload: OutboundPayload,
    projectKey: string
  ): Record<string, unknown> {
    const eventLabels: Record<string, string> = {
      'task.created': 'Task Created',
      'task.completed': 'Task Completed',
      'task.assigned': 'Task Assigned',
    };

    const summary = `[TaskSaaS] ${eventLabels[payload.event] ?? payload.event}`;
    const descriptionLines = Object.entries(payload.data)
      .map(([key, value]) => `*${key}*: ${String(value)}`)
      .join('\n');

    return {
      fields: {
        project: { key: projectKey },
        summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `Event: ${payload.event}\nTimestamp: ${payload.timestamp}\n\n${descriptionLines}`,
                },
              ],
            },
          ],
        },
        issuetype: { name: 'Task' },
        labels: ['tasksaas-sync'],
      },
    };
  }
}
