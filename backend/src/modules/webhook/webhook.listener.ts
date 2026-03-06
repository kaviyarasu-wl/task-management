import { EventBus, EventPayloads, EventName } from '@core/events/EventBus';
import { WebhookService, WEBHOOK_EVENTS } from './webhook.service';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('WebhookListener');

/**
 * Webhook listener — subscribes to domain events and queues webhook deliveries.
 * This bridges internal domain events to external integrations.
 *
 * No direct import from other modules — just EventBus events.
 */
export function registerWebhookListeners(): void {
  const webhookService = new WebhookService();

  // Subscribe to each webhook-eligible event
  for (const eventName of WEBHOOK_EVENTS) {
    EventBus.on(eventName as EventName, async (payload: EventPayloads[EventName]) => {
      const tenantId = (payload as { tenantId?: string }).tenantId;
      if (!tenantId) return;

      try {
        await webhookService.queueDelivery(eventName, payload as Record<string, unknown>, tenantId);
      } catch (error) {
        log.error({ err: error, eventName }, 'Error queueing webhook');
      }
    });
  }

  log.info('Webhook listeners registered');
}
