/**
 * Seed script to create initial SuperAdmin user.
 *
 * Usage:
 *   npx tsx src/scripts/seed-superadmin.ts
 *
 * Environment variables:
 *   SUPERADMIN_EMAIL    - Email for the admin (default: admin@example.com)
 *   SUPERADMIN_PASSWORD - Password for the admin (default: ChangeMe123!)
 *   SUPERADMIN_FIRST    - First name (default: Super)
 *   SUPERADMIN_LAST     - Last name (default: Admin)
 */

import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb/client';
import { SuperAdminAuthService } from '@modules/admin/superadmin-auth.service';

async function seedSuperAdmin(): Promise<void> {
  console.log('🔄 Connecting to MongoDB...');
  await connectMongoDB();

  const authService = new SuperAdminAuthService();

  const email = process.env.SUPERADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SUPERADMIN_PASSWORD ?? 'ChangeMe123!';
  const firstName = process.env.SUPERADMIN_FIRST ?? 'Super';
  const lastName = process.env.SUPERADMIN_LAST ?? 'Admin';

  try {
    const admin = await authService.createAdmin({
      email,
      password,
      firstName,
      lastName,
    });

    console.log('✅ SuperAdmin created successfully');
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID: ${admin._id}`);
    console.log('');
    console.log('⚠️  Remember to change the default password in production!');
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Email already registered') {
      console.log('ℹ️  SuperAdmin already exists with email:', email);
    } else {
      console.error('❌ Failed to create SuperAdmin:', err);
      process.exitCode = 1;
    }
  } finally {
    await disconnectMongoDB();
    process.exit();
  }
}

void seedSuperAdmin();
