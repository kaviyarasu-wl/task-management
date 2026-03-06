import crypto from 'crypto';
import { IntegrationAdapter, OutboundPayload, InboundResult } from './base.adapter';
import { IIntegration } from '../integration.model';
import { decryptConfig } from '../crypto';

export class GitHubAdapter implements IntegrationAdapter {
  readonly provider = 'github';

  async pushEvent(integration: IIntegration, payload: OutboundPayload): Promise<void> {
    const integrationConfig = decryptConfig(integration.config) as {
      accessToken: string;
      repository: string;
    };

    const [owner, repo] = integrationConfig.repository.split('/');

    // Create a GitHub issue comment or label based on the event
    const body = this.formatGitHubBody(payload);

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integrationConfig.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`GitHub API failed: HTTP ${response.status} - ${errorBody.substring(0, 500)}`);
    }
  }

  verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
    // GitHub sends: sha256=<hex>
    const expectedSig = signature.replace('sha256=', '');
    if (!expectedSig) return false;

    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSig.length !== computed.length) return false;

    return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(computed));
  }

  parseInboundWebhook(body: unknown, headers: Record<string, string>): InboundResult {
    const eventType = headers['x-github-event'];
    const githubBody = body as {
      action?: string;
      issue?: { title?: string; body?: string; number?: number; html_url?: string };
      pull_request?: { title?: string; number?: number; html_url?: string };
    };

    // Issue opened -> create task
    if (eventType === 'issues' && githubBody.action === 'opened' && githubBody.issue) {
      return {
        action: 'task.create',
        data: {
          title: githubBody.issue.title ?? 'Untitled GitHub Issue',
          description: githubBody.issue.body ?? '',
          externalUrl: githubBody.issue.html_url,
          externalId: `github:issue:${githubBody.issue.number}`,
        },
      };
    }

    // Issue closed -> update task
    if (eventType === 'issues' && githubBody.action === 'closed' && githubBody.issue) {
      return {
        action: 'task.update',
        data: {
          externalId: `github:issue:${githubBody.issue.number}`,
          status: 'completed',
        },
      };
    }

    // PR opened -> link to task
    if (eventType === 'pull_request' && githubBody.action === 'opened' && githubBody.pull_request) {
      return {
        action: 'task.link',
        data: {
          title: githubBody.pull_request.title ?? 'Untitled PR',
          externalUrl: githubBody.pull_request.html_url,
          externalId: `github:pr:${githubBody.pull_request.number}`,
        },
      };
    }

    return { action: 'ignore' };
  }

  async testConnection(integration: IIntegration): Promise<{ ok: boolean; error?: string }> {
    try {
      const integrationConfig = decryptConfig(integration.config) as {
        accessToken: string;
        repository: string;
      };

      const [owner, repo] = integrationConfig.repository.split('/');

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            'Authorization': `Bearer ${integrationConfig.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private formatGitHubBody(payload: OutboundPayload): Record<string, unknown> {
    const eventLabels: Record<string, string> = {
      'task.created': 'Task Created',
      'task.completed': 'Task Completed',
      'task.assigned': 'Task Assigned',
    };

    const title = `[TaskSaaS] ${eventLabels[payload.event] ?? payload.event}`;
    const bodyLines = Object.entries(payload.data)
      .map(([key, value]) => `- **${key}**: ${String(value)}`)
      .join('\n');

    return {
      title,
      body: `Event: ${payload.event}\nTimestamp: ${payload.timestamp}\n\n${bodyLines}`,
      labels: ['tasksaas-sync'],
    };
  }
}
