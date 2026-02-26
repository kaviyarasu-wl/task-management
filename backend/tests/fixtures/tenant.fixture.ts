import { randomUUID } from 'crypto';

export function makeTenant(overrides: Partial<{
  tenantId: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  ownerId: string;
}> = {}) {
  return {
    tenantId: overrides.tenantId ?? randomUUID(),
    name: overrides.name ?? 'Test Org',
    slug: overrides.slug ?? 'test-org',
    plan: overrides.plan ?? 'free',
    ownerId: overrides.ownerId ?? randomUUID(),
    settings: { maxUsers: 5, maxProjects: 3, allowedPlugins: [] },
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function makeUser(tenantId: string, overrides: Partial<{
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  firstName: string;
  lastName: string;
}> = {}) {
  return {
    _id: overrides.userId ?? randomUUID(),
    tenantId,
    email: overrides.email ?? 'user@example.com',
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    role: overrides.role ?? 'member',
    isEmailVerified: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
