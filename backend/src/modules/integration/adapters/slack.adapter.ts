import crypto from 'crypto';
import { IntegrationAdapter, OutboundPayload, InboundResult } from './base.adapter';
import { IIntegration } from '../integration.model';
import { decryptConfig } from '../crypto';

export class SlackAdapter implements IntegrationAdapter {
  readonly provider = 'slack';

  async pushEvent(integration: IIntegration, payload: OutboundPayload): Promise<void> {
    const integrationConfig = decryptConfig(integration.config) as {
      webhookUrl: string;
      channel?: string;
    };

    const slackMessage = this.formatSlackMessage(payload);

    const response = await fetch(integrationConfig.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: HTTP ${response.status}`);
    }
  }

  verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
    const timestamp = signature.split(',')[0]?.split('=')[1] ?? '';
    const sigHash = signature.split(',')[1]?.split('=')[1] ?? '';

    // Guard against timing attacks on empty values
    if (!timestamp || !sigHash) return false;

    const baseString = `v0:${timestamp}:${rawBody.toString()}`;
    const expected = crypto.createHmac('sha256', secret).update(baseString).digest('hex');

    if (sigHash.length !== expected.length) return false;

    return crypto.timingSafeEqual(Buffer.from(sigHash), Buffer.from(expected));
  }

  parseInboundWebhook(body: unknown, _headers: Record<string, string>): InboundResult {
    const slackBody = body as { command?: string; text?: string };

    // Handle slash commands (e.g., /task create Fix the login bug)
    if (slackBody.command === '/task' && slackBody.text) {
      const [action, ...titleParts] = slackBody.text.split(' ');
      if (action === 'create') {
        return {
          action: 'task.create',
          data: { title: titleParts.join(' ') },
        };
      }
    }

    return { action: 'ignore' };
  }

  async testConnection(integration: IIntegration): Promise<{ ok: boolean; error?: string }> {
    try {
      const integrationConfig = decryptConfig(integration.config) as { webhookUrl: string };
      const response = await fetch(integrationConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Integration test from TaskSaaS' }),
      });
      return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private formatSlackMessage(payload: OutboundPayload): Record<string, unknown> {
    const eventLabels: Record<string, string> = {
      'task.created': 'New Task Created',
      'task.completed': 'Task Completed',
      'task.assigned': 'Task Assigned',
      'task.updated': 'Task Updated',
      'task.deleted': 'Task Deleted',
      'project.created': 'New Project Created',
      'project.updated': 'Project Updated',
      'project.deleted': 'Project Deleted',
      'comment.created': 'New Comment',
      'user.invited': 'User Invited',
      'invitation.accepted': 'Invitation Accepted',
    };

    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${eventLabels[payload.event] ?? payload.event}*`,
          },
        },
        {
          type: 'section',
          fields: Object.entries(payload.data)
            .slice(0, 10)
            .map(([key, value]) => ({
              type: 'mrkdwn',
              text: `*${key}:* ${String(value)}`,
            })),
        },
      ],
    };
  }
}
