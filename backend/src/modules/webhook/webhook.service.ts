import crypto from 'crypto';
import { Types } from 'mongoose';
import { WebhookRepository, WebhookFilters } from './webhook.repository';
import { WebhookDeliveryRepository, DeliveryFilters } from './webhookDelivery.repository';
import { IWebhook } from './webhook.model';
import { IWebhookDelivery } from './webhookDelivery.model';
import { RequestContext } from '@core/context/RequestContext';
import { ForbiddenError, NotFoundError } from '@core/errors/AppError';
import { webhookQueue } from '@infrastructure/queue/queues';
import { PaginatedResult, PaginationQuery } from '../../types';

// Events that can trigger webhooks
export const WEBHOOK_EVENTS = [
  'task.created',
  'task.updated',
  'task.deleted',
  'task.completed',
  'task.assigned',
  'project.created',
  'project.updated',
  'project.deleted',
  'comment.created',
  'user.invited',
  'invitation.accepted',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export class WebhookService {
  private webhookRepo: WebhookRepository;
  private deliveryRepo: WebhookDeliveryRepository;

  constructor() {
    this.webhookRepo = new WebhookRepository();
    this.deliveryRepo = new WebhookDeliveryRepository();
  }

  async list(
    filters: WebhookFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<IWebhook>> {
    const { tenantId } = RequestContext.get();
    return this.webhookRepo.findAll(tenantId, filters, query);
  }

  async getById(webhookId: string): Promise<IWebhook> {
    const { tenantId } = RequestContext.get();
    const webhook = await this.webhookRepo.findById(tenantId, webhookId);
    if (!webhook) throw new NotFoundError('Webhook');
    return webhook;
  }

  async create(data: {
    name: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
  }): Promise<IWebhook> {
    const { tenantId, userId } = RequestContext.get();

    // Generate cryptographically secure secret for HMAC signatures
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await this.webhookRepo.create({
      tenantId,
      name: data.name,
      url: data.url,
      secret,
      events: data.events,
      createdBy: new Types.ObjectId(userId),
      headers: data.headers,
    });

    return webhook;
  }

  async update(
    webhookId: string,
    data: {
      name?: string;
      url?: string;
      events?: string[];
      headers?: Record<string, string>;
      isActive?: boolean;
    }
  ): Promise<IWebhook> {
    const { tenantId, role } = RequestContext.get();

    const existing = await this.webhookRepo.findById(tenantId, webhookId);
    if (!existing) throw new NotFoundError('Webhook');

    // Only admins and owners can update webhooks
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenError('Only admins can update webhooks');
    }

    const updated = await this.webhookRepo.update(tenantId, webhookId, data);
    if (!updated) throw new NotFoundError('Webhook');

    return updated;
  }

  async delete(webhookId: string): Promise<void> {
    const { tenantId, role } = RequestContext.get();

    const webhook = await this.webhookRepo.findById(tenantId, webhookId);
    if (!webhook) throw new NotFoundError('Webhook');

    // Only admins and owners can delete webhooks
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenError('Only admins can delete webhooks');
    }

    await this.webhookRepo.softDelete(tenantId, webhookId);
  }

  async regenerateSecret(webhookId: string): Promise<{ secret: string }> {
    const { tenantId, role } = RequestContext.get();

    const webhook = await this.webhookRepo.findById(tenantId, webhookId);
    if (!webhook) throw new NotFoundError('Webhook');

    // Only admins and owners can regenerate secrets
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenError('Only admins can regenerate webhook secrets');
    }

    const newSecret = crypto.randomBytes(32).toString('hex');
    await this.webhookRepo.update(tenantId, webhookId, { secret: newSecret } as Partial<IWebhook>);

    return { secret: newSecret };
  }

  async test(webhookId: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }> {
    const { tenantId } = RequestContext.get();

    const webhook = await this.webhookRepo.findById(tenantId, webhookId);
    if (!webhook) throw new NotFoundError('Webhook');

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook._id?.toString(),
      },
    };

    const body = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': 'webhook.test',
          ...(webhook.headers ?? {}),
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async queueDelivery(
    event: string,
    payload: Record<string, unknown>,
    tenantId: string
  ): Promise<void> {
    // Find all active webhooks subscribed to this event
    const webhooks = await this.webhookRepo.findByEvent(tenantId, event);

    for (const webhook of webhooks) {
      if (!webhook.isActive) continue;

      // Create delivery record
      const delivery = await this.deliveryRepo.create({
        tenantId,
        webhookId: webhook._id as Types.ObjectId,
        event,
        payload,
      });

      // Queue for delivery with exponential backoff
      // Use deliveryId as jobId to prevent duplicate sends
      const deliveryId = delivery._id?.toString() ?? '';
      await webhookQueue.add(
        'deliver',
        { deliveryId, tenantId },
        {
          jobId: `webhook:${deliveryId}`,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute initial delay
          },
        }
      );
    }
  }

  async getDeliveryHistory(
    webhookId: string,
    query: PaginationQuery,
    filters?: DeliveryFilters
  ): Promise<PaginatedResult<IWebhookDelivery>> {
    const { tenantId } = RequestContext.get();

    // Verify webhook exists and belongs to tenant
    const webhook = await this.webhookRepo.findById(tenantId, webhookId);
    if (!webhook) throw new NotFoundError('Webhook');

    return this.deliveryRepo.findByWebhook(tenantId, webhookId, query, filters);
  }

  async retryDelivery(webhookId: string, deliveryId: string): Promise<void> {
    const { tenantId } = RequestContext.get();

    // Verify webhook exists
    const webhook = await this.webhookRepo.findById(tenantId, webhookId);
    if (!webhook) throw new NotFoundError('Webhook');

    // Verify delivery exists
    const delivery = await this.deliveryRepo.findById(tenantId, deliveryId);
    if (!delivery) throw new NotFoundError('Webhook delivery');

    // Only allow retrying failed deliveries
    if (delivery.status !== 'failed') {
      throw new ForbiddenError('Can only retry failed deliveries');
    }

    // Reset delivery status
    await this.deliveryRepo.update(deliveryId, {
      status: 'pending',
      attemptCount: 0,
      error: undefined,
    });

    // Queue for delivery
    await webhookQueue.add('deliver', {
      deliveryId,
      tenantId,
    });
  }

  getAvailableEvents(): string[] {
    return [...WEBHOOK_EVENTS];
  }
}
