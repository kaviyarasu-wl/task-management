import { Job } from 'bullmq';
import { IntegrationJobData } from '../queues';
import { IntegrationRepository } from '@modules/integration/integration.repository';
import { IntegrationEventRepository } from '@modules/integration/integrationEvent.repository';
import { SlackAdapter } from '@modules/integration/adapters/slack.adapter';
import { GitHubAdapter } from '@modules/integration/adapters/github.adapter';
import { JiraAdapter } from '@modules/integration/adapters/jira.adapter';
import { IntegrationAdapter, OutboundPayload } from '@modules/integration/adapters/base.adapter';
import { EventBus } from '@core/events/EventBus';
import { createLogger } from '@infrastructure/logger';
import { Types } from 'mongoose';

const log = createLogger('IntegrationProcessor');

const adapters = new Map<string, IntegrationAdapter>([
  ['slack', new SlackAdapter()],
  ['github', new GitHubAdapter()],
  ['jira', new JiraAdapter()],
]);

export async function integrationProcessor(job: Job<IntegrationJobData>): Promise<void> {
  const { integrationId, event, payload, tenantId } = job.data;

  log.info({ integrationId, event }, 'Processing integration push');

  const integrationRepo = new IntegrationRepository();
  const eventRepo = new IntegrationEventRepository();
  const integration = await integrationRepo.findById(tenantId, integrationId);

  if (!integration) {
    log.warn({ integrationId }, 'Integration not found, skipping');
    return;
  }

  if (integration.status !== 'active') {
    log.warn({ integrationId, status: integration.status }, 'Integration not active, skipping');
    return;
  }

  const adapter = adapters.get(integration.provider);
  if (!adapter) {
    log.error({ provider: integration.provider }, 'No adapter found for provider');
    return;
  }

  const outboundPayload: OutboundPayload = {
    event,
    data: payload,
    tenantId,
    timestamp: new Date().toISOString(),
  };

  try {
    await adapter.pushEvent(integration, outboundPayload);

    await integrationRepo.markSynced(integrationId);

    // Log successful event
    await eventRepo.create({
      tenantId,
      connectionId: new Types.ObjectId(integrationId),
      eventType: event,
      direction: 'outbound',
      status: 'success',
      payload,
      responseCode: 200,
    });

    EventBus.emit('integration.syncCompleted', {
      integrationId,
      tenantId,
      provider: integration.provider,
    });

    log.info({ integrationId, event }, 'Integration push delivered');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const currentAttempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    log.error({ integrationId, event, attempt: currentAttempt, maxAttempts, err: error }, 'Integration push failed');

    // Log failed event
    await eventRepo.create({
      tenantId,
      connectionId: new Types.ObjectId(integrationId),
      eventType: event,
      direction: 'outbound',
      status: 'failed',
      payload,
      errorMessage,
    });

    if (currentAttempt >= maxAttempts) {
      await integrationRepo.markError(integrationId, errorMessage);
    }

    // Re-throw to trigger BullMQ retry
    throw error;
  }
}
