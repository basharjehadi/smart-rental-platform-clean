#!/usr/bin/env node

/**
 * 🚀 Migration Script: Remove Tenant Limits and Add Property Availability
 * 
 * This script safely migrates the database from the old tenant capacity system
 * to the new property-based availability system.
 * 
 * Run with: node scripts/migrate_tenant_limits.js
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function confirmMigration() {
  return new Promise((resolve) => {
    rl.question(`
🚀 Tenant Limits Migration Script

This script will:
1. Remove tenant capacity fields from User, LandlordProfile, and Property models
2. Add availability field to Property model
3. Update database indexes
4. Migrate existing data to new structure

⚠️  WARNING: This is a destructive operation that cannot be undone!
⚠️  Make sure you have a backup of your database!

Do you want to continue? (yes/no): `, (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function migrateDatabase() {
  try {
    console.log('🔄 Starting migration...');

    // Step 1: Add availability field to properties table
    console.log('📝 Step 1: Adding availability field to properties...');
    await prisma.$executeRaw`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS "availability" BOOLEAN NOT NULL DEFAULT true
    `;

    // Step 2: Update existing properties to set availability based on status
    console.log('📝 Step 2: Setting initial availability values...');
    await prisma.$executeRaw`
      UPDATE properties 
      SET "availability" = (status = 'AVAILABLE')
    `;

    // Step 3: Remove tenant capacity fields from users table
    console.log('📝 Step 3: Removing tenant capacity fields from users...');
    await prisma.$executeRaw`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS "autoAvailability"
    `;
    await prisma.$executeRaw`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS "maxTenants"
    `;
    await prisma.$executeRaw`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS "currentTenants"
    `;

    // Step 4: Remove tenant capacity fields from landlord_profiles table
    console.log('📝 Step 4: Removing tenant capacity fields from landlord_profiles...');
    await prisma.$executeRaw`
      ALTER TABLE landlord_profiles 
      DROP COLUMN IF EXISTS "maxTenants"
    `;
    await prisma.$executeRaw`
      ALTER TABLE landlord_profiles 
      DROP COLUMN IF EXISTS "currentTenants"
    `;
    await prisma.$executeRaw`
      ALTER TABLE landlord_profiles 
      DROP COLUMN IF EXISTS "autoAvailability"
    `;

    // Step 5: Remove tenant capacity fields from properties table
    console.log('📝 Step 5: Removing tenant capacity fields from properties...');
    await prisma.$executeRaw`
      ALTER TABLE properties 
      DROP COLUMN IF EXISTS "maxTenants"
    `;
    await prisma.$executeRaw`
      ALTER TABLE properties 
      DROP COLUMN IF EXISTS "currentTenants"
    `;

    // Step 6: Update landlord availability based on property availability
    console.log('📝 Step 6: Updating landlord availability...');
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      select: { id: true }
    });

    for (const landlord of landlords) {
      const availableProperties = await prisma.property.count({
        where: {
          landlordId: landlord.id,
          status: 'AVAILABLE',
          availability: true
        }
      });

      await prisma.user.update({
        where: { id: landlord.id },
        data: {
          availability: availableProperties > 0
        }
      });
    }

    // Step 7: Update database indexes
    console.log('📝 Step 7: Updating database indexes...');
    
    // Drop old indexes
    try {
      await prisma.$executeRaw`DROP INDEX IF EXISTS "users_role_availability_autoAvailability_currentTenants_idx"`;
      await prisma.$executeRaw`DROP INDEX IF EXISTS "landlord_profiles_maxTenants_currentTenants_idx"`;
      await prisma.$executeRaw`DROP INDEX IF EXISTS "landlord_profiles_manualAvailability_autoAvailability_idx"`;
      await prisma.$executeRaw`DROP INDEX IF EXISTS "properties_landlordId_status_idx"`;
      await prisma.$executeRaw`DROP INDEX IF EXISTS "properties_city_status_idx"`;
      await prisma.$executeRaw`DROP INDEX IF EXISTS "properties_propertyType_status_idx"`;
      await prisma.$executeRaw`DROP INDEX IF EXISTS "properties_monthlyRent_status_idx"`;
    } catch (error) {
      console.log('⚠️  Some indexes may not exist, continuing...');
    }

    // Create new indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_role_availability_idx" ON "users"("role", "availability")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "landlord_profiles_manualAvailability_idx" ON "landlord_profiles"("manualAvailability")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_landlordId_status_availability_idx" ON "properties"("landlordId", "status", "availability")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_city_status_availability_idx" ON "properties"("city", "status", "availability")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_propertyType_status_availability_idx" ON "properties"("propertyType", "status", "availability")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_monthlyRent_status_availability_idx" ON "properties"("monthlyRent", "status", "availability")`;

    console.log('✅ Migration completed successfully!');
    
    // Print summary
    const totalProperties = await prisma.property.count();
    const availableProperties = await prisma.property.count({
      where: { availability: true }
    });
    const totalLandlords = await prisma.user.count({
      where: { role: 'LANDLORD' }
    });
    const availableLandlords = await prisma.user.count({
      where: { role: 'LANDLORD', availability: true }
    });

    console.log(`
📊 Migration Summary:
- Total Properties: ${totalProperties}
- Available Properties: ${availableProperties}
- Total Landlords: ${totalLandlords}
- Available Landlords: ${availableLandlords}
    `);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    const confirmed = await confirmMigration();
    
    if (!confirmed) {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }

    await migrateDatabase();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
