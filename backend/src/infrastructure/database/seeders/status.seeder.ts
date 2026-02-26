import { Status } from '@modules/status/status.model';
import { StatusCategory, StatusIcon } from '../../../types/status.types';

/**
 * Default status configuration matching the previous hardcoded enum.
 * These statuses are seeded for all new tenants.
 */
export interface DefaultStatusConfig {
  name: string;
  slug: string;
  color: string;
  icon: StatusIcon;
  category: StatusCategory;
  order: number;
  isDefault: boolean;
}

export const DEFAULT_STATUSES: DefaultStatusConfig[] = [
  {
    name: 'To Do',
    slug: 'todo',
    color: '#94a3b8', // slate
    icon: 'circle',
    category: 'open',
    order: 0,
    isDefault: true,
  },
  {
    name: 'In Progress',
    slug: 'in-progress',
    color: '#3b82f6', // blue
    icon: 'loader',
    category: 'in_progress',
    order: 1,
    isDefault: false,
  },
  {
    name: 'Review',
    slug: 'review',
    color: '#8b5cf6', // purple
    icon: 'eye',
    category: 'in_progress',
    order: 2,
    isDefault: false,
  },
  {
    name: 'Done',
    slug: 'done',
    color: '#22c55e', // green
    icon: 'circle-check',
    category: 'closed',
    order: 3,
    isDefault: false,
  },
  {
    name: 'Cancelled',
    slug: 'cancelled',
    color: '#ef4444', // red
    icon: 'circle-x',
    category: 'closed',
    order: 4,
    isDefault: false,
  },
];

/**
 * Default workflow transitions defining valid status changes.
 * Key: source status slug, Value: array of allowed target status slugs
 */
export const DEFAULT_TRANSITIONS: Record<string, string[]> = {
  'todo': ['in-progress', 'cancelled'],
  'in-progress': ['review', 'done', 'todo', 'cancelled'],
  'review': ['done', 'in-progress', 'cancelled'],
  'done': ['in-progress'], // Can reopen
  'cancelled': ['todo'], // Can restore
};

/**
 * Seeds default statuses for a tenant.
 * Idempotent: skips if tenant already has statuses.
 *
 * @param tenantId - The tenant ID to seed statuses for
 * @returns Promise<void>
 */
export async function seedStatusesForTenant(tenantId: string): Promise<void> {
  // Check if tenant already has statuses (idempotent)
  const existingCount = await Status.countDocuments({ tenantId });
  if (existingCount > 0) {
    console.log(`[Status Seeder] Tenant ${tenantId} already has ${existingCount} statuses, skipping seed`);
    return;
  }

  console.log(`[Status Seeder] Seeding statuses for tenant ${tenantId}...`);

  // Step 1: Create statuses without transitions
  const createdStatuses = await Status.insertMany(
    DEFAULT_STATUSES.map((statusConfig) => ({
      ...statusConfig,
      tenantId,
      allowedTransitions: [], // Will be populated after all statuses exist
    }))
  );

  // Step 2: Create slug -> ObjectId mapping
  const slugToId = new Map<string, string>(
    createdStatuses.map((status) => [status.slug, status._id.toString()])
  );

  // Step 3: Update each status with its allowed transitions
  const updatePromises = createdStatuses.map(async (status) => {
    const allowedSlugs = DEFAULT_TRANSITIONS[status.slug] ?? [];
    const allowedIds = allowedSlugs
      .map((slug) => slugToId.get(slug))
      .filter((id): id is string => id !== undefined);

    return Status.updateOne(
      { _id: status._id },
      { $set: { allowedTransitions: allowedIds } }
    );
  });

  await Promise.all(updatePromises);

  console.log(`[Status Seeder] Successfully seeded ${createdStatuses.length} statuses for tenant ${tenantId}`);
}
