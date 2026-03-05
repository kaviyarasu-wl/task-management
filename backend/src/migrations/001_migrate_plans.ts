/**
 * Migration: Create Plan documents and migrate tenants from legacy plan field
 *
 * Usage:
 *   npx tsx src/migrations/001_migrate_plans.ts up
 *   npx tsx src/migrations/001_migrate_plans.ts down
 */

import { Plan } from '@modules/admin/models/plan.model';
import { Tenant } from '@modules/tenant/tenant.model';
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb/client';

interface LegacyPlanData {
  name: string;
  slug: string;
  description: string;
  projectsLimit: number;
  usersLimit: number;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  sortOrder: number;
  isDefault?: boolean;
}

const LEGACY_PLANS: Record<string, LegacyPlanData> = {
  free: {
    name: 'Free',
    slug: 'free',
    description: 'Get started with basic features',
    projectsLimit: 3,
    usersLimit: 5,
    price: 0,
    billingCycle: 'monthly',
    features: ['basic_tasks', 'basic_projects', 'email_support'],
    sortOrder: 0,
    isDefault: true,
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    description: 'For growing teams',
    projectsLimit: 20,
    usersLimit: 25,
    price: 15,
    billingCycle: 'monthly',
    features: [
      'basic_tasks',
      'basic_projects',
      'advanced_reports',
      'api_access',
      'webhooks',
      'priority_support',
    ],
    sortOrder: 1,
  },
  enterprise: {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For large organizations',
    projectsLimit: -1, // unlimited
    usersLimit: -1,    // unlimited
    price: 99,
    billingCycle: 'monthly',
    features: [
      'basic_tasks',
      'basic_projects',
      'advanced_reports',
      'api_access',
      'webhooks',
      'custom_branding',
      'sso',
      'dedicated_support',
      'sla_guarantee',
    ],
    sortOrder: 2,
  },
};

export async function up(): Promise<void> {
  console.log('Starting plan migration...');

  // Step 1: Create Plan documents
  const planMap = new Map<string, string>(); // legacySlug -> planId

  for (const [legacySlug, planData] of Object.entries(LEGACY_PLANS)) {
    const existing = await Plan.findOne({ slug: planData.slug });

    if (existing) {
      planMap.set(legacySlug, existing._id.toString());
      console.log(`Plan "${legacySlug}" already exists (${existing._id})`);
    } else {
      const plan = await Plan.create({
        ...planData,
        isActive: true,
      });
      planMap.set(legacySlug, plan._id.toString());
      console.log(`Created plan: ${planData.name} (${plan._id})`);
    }
  }

  // Step 2: Update tenants to reference Plan ObjectId
  // Find tenants that don't have planId set yet
  const tenants = await Tenant.find({
    $or: [
      { planId: { $exists: false } },
      { planId: null },
    ],
  });
  console.log(`Migrating ${tenants.length} tenants...`);

  let migrated = 0;
  const freePlanId = planMap.get('free');

  for (const tenant of tenants) {
    // Get legacy plan value, default to 'free' if not set
    const legacyPlan = (tenant as unknown as { plan?: string }).plan ?? 'free';
    const planId = planMap.get(legacyPlan);

    if (!planId) {
      console.warn(`Unknown plan "${legacyPlan}" for tenant ${tenant.slug}, using free`);
      (tenant as unknown as { planId: string }).planId = freePlanId!;
    } else {
      (tenant as unknown as { planId: string }).planId = planId;
    }

    await tenant.save();
    migrated++;

    if (migrated % 100 === 0) {
      console.log(`Migrated ${migrated}/${tenants.length} tenants`);
    }
  }

  console.log(`Plan migration complete! Migrated ${migrated} tenants.`);
}

export async function down(): Promise<void> {
  console.log('Rolling back plan migration...');

  // Remove planId from all tenants
  await Tenant.updateMany({}, { $unset: { planId: 1 } });
  console.log('Removed planId from all tenants');

  // Note: We intentionally don't delete Plan documents in rollback
  // to preserve any admin modifications. Uncomment below if needed:
  // await Plan.deleteMany({});
  // console.log('Deleted all plan documents');

  console.log('Rollback complete.');
}

// CLI runner
async function main(): Promise<void> {
  const action = process.argv[2];

  if (!['up', 'down'].includes(action)) {
    console.log('Usage: npx tsx src/migrations/001_migrate_plans.ts [up|down]');
    process.exit(1);
  }

  try {
    await connectMongoDB();

    if (action === 'up') {
      await up();
    } else {
      await down();
    }

    await disconnectMongoDB();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();
