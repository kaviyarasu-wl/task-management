/**
 * Migration: 002 - Migrate User Roles to Dynamic Role System
 *
 * This migration:
 * 1. Seeds system roles for all existing tenants (if not already seeded)
 * 2. Converts user.role (string) to user.roleId (ObjectId reference)
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npm run migrate:roles
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../../../config';
import { Tenant } from '@modules/tenant/tenant.model';
import { User } from '@modules/user/user.model';
import { Role } from '@modules/role/role.model';
import { SYSTEM_ROLES } from '@modules/role/permissions';

interface MigrationStats {
  tenantsProcessed: number;
  rolesCreated: number;
  usersUpdated: number;
  usersSkipped: number;
  errors: string[];
}

async function migrate(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Role Migration Script - v002');
  console.log('='.repeat(60));
  console.log('');

  const stats: MigrationStats = {
    tenantsProcessed: 0,
    rolesCreated: 0,
    usersUpdated: 0,
    usersSkipped: 0,
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

    // Get all active tenants
    const tenants = await Tenant.find({ isActive: true });
    console.log(`Found ${tenants.length} active tenants\n`);

    for (const tenant of tenants) {
      const tenantId = tenant.tenantId;
      console.log(`Processing tenant: ${tenant.name} (${tenantId})`);
      console.log('-'.repeat(50));

      try {
        // Step 1: Ensure system roles exist (idempotent)
        const existingRoles = await Role.find({ tenantId, isSystem: true, deletedAt: null });
        if (existingRoles.length === 0) {
          const roleDocs = Object.values(SYSTEM_ROLES).map((r) => ({
            tenantId,
            name: r.name,
            slug: r.slug,
            description: r.description,
            permissions: r.permissions,
            isSystem: true,
          }));
          await Role.insertMany(roleDocs);
          stats.rolesCreated += roleDocs.length;
          console.log(`  Created ${roleDocs.length} system roles`);
        } else {
          console.log(`  System roles already exist (${existingRoles.length} found)`);
        }

        // Step 2: Build slug -> roleId mapping
        const roles = await Role.find({ tenantId, isSystem: true, deletedAt: null });
        const roleMap = new Map(roles.map((r) => [r.slug, r._id]));

        // Step 3: Update users that don't have roleId set
        const users = await User.find({ tenantId, deletedAt: null });
        let updated = 0;
        let skipped = 0;

        for (const user of users) {
          // Skip if already has roleId
          if (user.roleId) {
            skipped++;
            continue;
          }

          const roleId = roleMap.get(user.role);
          if (roleId) {
            await User.updateOne({ _id: user._id }, { $set: { roleId } });
            updated++;
          } else {
            // Unknown role string, default to member
            const memberRoleId = roleMap.get('member');
            if (memberRoleId) {
              await User.updateOne({ _id: user._id }, { $set: { roleId: memberRoleId } });
              updated++;
              console.warn(`  User ${user.email}: Unknown role "${user.role}", assigned to "member"`);
            }
          }
        }

        stats.usersUpdated += updated;
        stats.usersSkipped += skipped;
        stats.tenantsProcessed++;
        console.log(`  Migrated ${updated}/${users.length} users (${skipped} already migrated)`);
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
    console.log(`Roles created:     ${stats.rolesCreated}`);
    console.log(`Users updated:     ${stats.usersUpdated}`);
    console.log(`Users skipped:     ${stats.usersSkipped}`);

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
