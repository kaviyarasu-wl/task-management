/**
 * Migration: 001 - Migrate Tasks to Dynamic Statuses
 *
 * This migration:
 * 1. Seeds default statuses for all existing tenants
 * 2. Converts task status strings to ObjectId references
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npm run migrate:statuses
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../../../config';
import { Tenant } from '@modules/tenant/tenant.model';
import { Task } from '@modules/task/task.model';
import { Status, IStatusDocument } from '@modules/status/status.model';
import { seedStatusesForTenant } from '../seeders/status.seeder';

/**
 * Maps old hardcoded status strings to new slug values.
 * Handles both snake_case (old enum) and kebab-case formats.
 */
const STATUS_SLUG_MAP: Record<string, string> = {
  // Old enum format (snake_case)
  'todo': 'todo',
  'in_progress': 'in-progress',
  'review': 'review',
  'done': 'done',
  'cancelled': 'cancelled',
  // Already converted format (kebab-case)
  'in-progress': 'in-progress',
};

interface MigrationStats {
  tenantsProcessed: number;
  statusesCreated: number;
  tasksUpdated: number;
  tasksSkipped: number;
  errors: string[];
}

async function migrateTasksForTenant(
  tenantId: string,
  statuses: IStatusDocument[],
  stats: MigrationStats
): Promise<void> {
  // Create slug -> ObjectId mapping
  const slugToId = new Map<string, mongoose.Types.ObjectId>(
    statuses.map((s) => [s.slug, s._id])
  );

  // Find default status for fallback
  const defaultStatus = statuses.find((s) => s.isDefault);
  if (!defaultStatus) {
    stats.errors.push(`Tenant ${tenantId}: No default status found`);
    return;
  }

  // Find all tasks for this tenant
  const tasks = await Task.find({ tenantId }).lean();
  console.log(`  Found ${tasks.length} tasks to check`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const task of tasks) {
    const currentStatus = task.status;

    // Check if already migrated (status is ObjectId)
    if (currentStatus instanceof mongoose.Types.ObjectId) {
      skippedCount++;
      continue;
    }

    // Try to match string status
    const statusString = String(currentStatus);
    const normalizedSlug = STATUS_SLUG_MAP[statusString];
    let targetStatusId: mongoose.Types.ObjectId | undefined;

    if (normalizedSlug && slugToId.has(normalizedSlug)) {
      targetStatusId = slugToId.get(normalizedSlug);
    } else {
      // Unknown status, use default
      console.warn(`  Task ${task._id}: Unknown status "${statusString}", using default`);
      targetStatusId = defaultStatus._id;
    }

    if (targetStatusId) {
      await Task.updateOne(
        { _id: task._id },
        { $set: { status: targetStatusId } }
      );
      updatedCount++;
    }
  }

  stats.tasksUpdated += updatedCount;
  stats.tasksSkipped += skippedCount;
  console.log(`  Updated ${updatedCount} tasks, skipped ${skippedCount} (already migrated)`);
}

async function migrate(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Status Migration Script - v001');
  console.log('='.repeat(60));
  console.log('');

  const stats: MigrationStats = {
    tenantsProcessed: 0,
    statusesCreated: 0,
    tasksUpdated: 0,
    tasksSkipped: 0,
    errors: [],
  };

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected successfully\n');

    // Get all tenants
    const tenants = await Tenant.find({ isActive: true });
    console.log(`Found ${tenants.length} active tenants\n`);

    for (const tenant of tenants) {
      const tenantId = tenant._id.toString();
      console.log(`Processing tenant: ${tenant.name} (${tenantId})`);
      console.log('-'.repeat(50));

      try {
        // Step 1: Seed default statuses (idempotent)
        const statusesBefore = await Status.countDocuments({ tenantId });
        await seedStatusesForTenant(tenantId);
        const statusesAfter = await Status.countDocuments({ tenantId });
        const newStatuses = statusesAfter - statusesBefore;
        stats.statusesCreated += newStatuses;

        // Step 2: Get all statuses for this tenant
        const statuses = await Status.find({ tenantId });

        // Step 3: Migrate tasks
        await migrateTasksForTenant(tenantId, statuses, stats);

        stats.tenantsProcessed++;
        console.log('');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errors.push(`Tenant ${tenant.name}: ${errorMessage}`);
        console.error(`  ERROR: ${errorMessage}\n`);
      }
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Tenants processed: ${stats.tenantsProcessed}`);
    console.log(`Statuses created:  ${stats.statusesCreated}`);
    console.log(`Tasks updated:     ${stats.tasksUpdated}`);
    console.log(`Tasks skipped:     ${stats.tasksSkipped}`);

    if (stats.errors.length > 0) {
      console.log(`\nErrors (${stats.errors.length}):`);
      stats.errors.forEach((err) => console.log(`  - ${err}`));
    }

    console.log('\nMigration complete!');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { migrate };
