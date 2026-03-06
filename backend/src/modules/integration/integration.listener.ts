import { EventBus, EventPayloads, EventName } from '@core/events/EventBus';
import { IntegrationService } from './integration.service';
import { WEBHOOK_EVENTS } from '@modules/webhook/webhook.service';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('IntegrationListener');

export function registerIntegrationListeners(): void {
  const integrationService = new IntegrationService();

  // Subscribe to the same events as webhooks
  for (const eventName of WEBHOOK_EVENTS) {
    EventBus.on(eventName as EventName, async (payload: EventPayloads[EventName]) => {
      const tenantId = (payload as { tenantId?: string }).tenantId;
      if (!tenantId) return;

      try {
        await integrationService.queueOutboundPush(
          eventName,
          payload as Record<string, unknown>,
          tenantId
        );
      } catch (error) {
        log.error({ err: error, eventName }, 'Error queueing integration push');
      }
    });
  }

  log.info('Integration listeners registered');
}
