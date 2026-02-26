import { EventBus } from '@core/events/EventBus';
import { seedStatusesForTenant } from '@infrastructure/database/seeders/status.seeder';

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
    console.log(`[TenantListener] tenant.created → seeding default statuses for ${tenantId}`);

    try {
      await seedStatusesForTenant(tenantId);
      console.log(`[TenantListener] Successfully seeded statuses for tenant ${tenantId}`);
    } catch (error) {
      // Log error but don't crash — tenant creation should still succeed
      // Statuses can be seeded manually via migration if this fails
      console.error(`[TenantListener] Failed to seed statuses for tenant ${tenantId}:`, error);
    }
  });

  console.log('✅ Tenant listeners registered');
}
