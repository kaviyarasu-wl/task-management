import { EventBus } from '@core/events/EventBus';
import { seedStatusesForTenant } from '@infrastructure/database/seeders/status.seeder';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('TenantListener');

/**
 * Tenant module listener — reacts to tenant lifecycle events via EventBus.
 *
 * Registered once at startup in server.ts before any request is served.
 */
export function registerTenantListeners(): void {
  /**
   * tenant.created
   * Fires after a new org is registered with its first owner.
   * Seeds default statuses so the tenant can immediately create tasks.
   */
  EventBus.on('tenant.created', async ({ tenantId }) => {
    log.info({ tenantId }, 'Seeding default statuses for new tenant');

    try {
      await seedStatusesForTenant(tenantId);
      log.info({ tenantId }, 'Successfully seeded statuses');
    } catch (error) {
      // Log error but don't crash — tenant creation should still succeed
      // Statuses can be seeded manually via migration if this fails
      log.error({ err: error, tenantId }, 'Failed to seed statuses');
    }
  });

  log.info('Tenant listeners registered');
}
