import { EventBus } from '@core/events/EventBus';
import { createLogger } from '@infrastructure/logger';
import { RoleService } from './role.service';

const log = createLogger('RoleSeeder');
const roleService = new RoleService();

export function registerRoleSeederListeners(): void {
  EventBus.on('tenant.created', async ({ tenantId }) => {
    try {
      await roleService.seedSystemRoles(tenantId);
      log.info({ tenantId }, 'System roles seeded for tenant');
    } catch (err) {
      log.error({ err, tenantId }, 'Failed to seed roles for tenant');
    }
  });

  log.info('Role seeder listener registered');
}
