import { EventBus } from '@core/events/EventBus';
import { getRedisClient } from '@infrastructure/redis/client';
import { cache } from '@infrastructure/redis/cache';

/**
 * User module listener — reacts to cross-module events via EventBus.
 * Zero direct imports from other modules. Only EventBus + infrastructure.
 *
 * Registered once at startup in server.ts before any request is served.
 */
export function registerUserListeners(): void {

  /**
   * tenant.created
   * Fires after a new org is registered with its first owner.
   * Use this hook for: welcome email queuing, analytics events,
   * default preference seeding, audit log initialization.
   */
  EventBus.on('tenant.created', async ({ tenantId, ownerId, plan }) => {
    console.log(`[UserListener] tenant.created → tenantId=${tenantId} owner=${ownerId} plan=${plan}`);

    // Warm the user list cache for this new tenant so the first
    // GET /users doesn't cold-start against MongoDB
    await cache.del(cache.keys.projectList(tenantId)); // clear any stale keys
  });

  /**
   * user.invited
   * Fires when an admin/owner adds a new member to the org.
   * Use this hook for: audit log entry, activity feed, analytics.
   */
  EventBus.on('user.invited', async ({ userId, tenantId, email, role, invitedBy }) => {
    console.log(
      `[UserListener] user.invited → userId=${userId} email=${email} role=${role} by=${invitedBy} tenant=${tenantId}`
    );
    // Bust the tenant's user list cache so next GET /users reflects the new member
    await cache.delPattern(`cache:${tenantId}:users:*`);
  });

  /**
   * user.removed
   * Fires when a member is soft-deleted from the org.
   * Critical: must invalidate the removed user's refresh token immediately
   * so they cannot continue making authenticated requests.
   */
  EventBus.on('user.removed', async ({ userId, tenantId, removedBy }) => {
    console.log(
      `[UserListener] user.removed → userId=${userId} tenant=${tenantId} by=${removedBy}`
    );

    // Force logout — delete their refresh token from Redis
    const redis = getRedisClient();
    await redis.del(`refresh:${userId}`);

    // Bust user list cache
    await cache.delPattern(`cache:${tenantId}:users:*`);
  });

  console.log('✅ User listeners registered');
}
