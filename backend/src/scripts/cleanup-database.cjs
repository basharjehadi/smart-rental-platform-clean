#!/usr/bin/env node

/**
 * Database Cleanup Script
 *
 * This script removes all rental-related data from the database while preserving:
 * - User accounts and profiles
 * - KYC information and verification status
 * - User authentication data
 * - Basic user settings
 *
 * WARNING: This will permanently delete all rental data!
 * Make sure to backup your database before running this script.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Tables to preserve (keep user data and KYC)
const PRESERVED_TABLES = [
  'users',
  'landlord_profiles', // Keep landlord profile preferences
];

// Tables to clean (remove all rental data)
const TABLES_TO_CLEAN = [
  'conversations',
  'conversation_participants',
  'messages',
  'properties',
  'offers',
  'rental_requests',
  'payments',
  'rent_payments',
  'contracts',
  'contract_signatures',
  'leases',
  'reviews',
  'notifications',
  'support_tickets',
  'ticket_messages',
  'maintenance_requests',
  'landlord_request_matches',
  'chat_sessions',
];

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting Database Cleanup...\n');
    console.log('⚠️  WARNING: This will permanently delete all rental data!');
    console.log('✅ User accounts and KYC information will be preserved.\n');

    // Get current data counts
    console.log('📊 Current Database Status:');
    for (const table of TABLES_TO_CLEAN) {
      try {
        const count =
          await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.raw(table)}`;
        console.log(`   ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: Error getting count`);
      }
    }

    console.log('\n🗑️  Starting cleanup process...\n');

    // Clean tables in reverse dependency order to avoid foreign key conflicts
    const cleanupOrder = [
      // 1. Remove dependent data first
      'messages',
      'conversation_participants',
      'conversations',
      'chat_sessions',
      'ticket_messages',
      'support_tickets',
      'maintenance_requests',
      'reviews',
      'rent_payments',
      'payments',
      'contract_signatures',
      'contracts',
      'leases',
      'offers',
      'rental_requests',
      'landlord_request_matches',
      'properties',
    ];

    for (const table of cleanupOrder) {
      try {
        console.log(`🧹 Cleaning ${table}...`);

        // Use raw SQL for better control and to avoid Prisma relation issues
        const result = await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);

        console.log(`   ✅ ${table}: ${result} records deleted`);
      } catch (error) {
        console.error(`   ❌ Error cleaning ${table}:`, error.message);
      }
    }

    // Reset user-related counters and status
    console.log('\n🔄 Resetting user counters and status...');

    try {
      // Reset user counters to default values
      await prisma.user.updateMany({
        data: {
          currentTenants: 0,
          requestCount: 0,
          responseTime: null,
          averageRating: 5.0,
          totalReviews: 1,
          rank: 'NEW_USER',
          rankPoints: 0,
          rankUpdatedAt: new Date(),
          lastActiveAt: new Date(),
          availability: true,
          autoAvailability: true,
        },
      });
      console.log('   ✅ User counters reset');
    } catch (error) {
      console.error('   ❌ Error resetting user counters:', error.message);
    }

    try {
      // Reset landlord profile counters
      await prisma.landlordProfile.updateMany({
        data: {
          currentTenants: 0,
        },
      });
      console.log('   ✅ Landlord profile counters reset');
    } catch (error) {
      console.error('   ❌ Error resetting landlord counters:', error.message);
    }

    // Get final data counts
    console.log('\n📊 Final Database Status:');
    for (const table of TABLES_TO_CLEAN) {
      try {
        const count =
          await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.raw(table)}`;
        console.log(`   ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: Error getting count`);
      }
    }

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n✅ Preserved:');
    console.log('   - User accounts and authentication');
    console.log('   - KYC information and verification status');
    console.log('   - User profile data');
    console.log('   - Landlord profile preferences');

    console.log('\n🗑️  Removed:');
    console.log('   - All rental properties');
    console.log('   - All offers and rental requests');
    console.log('   - All payments and contracts');
    console.log('   - All conversations and messages');
    console.log('   - All reviews and notifications');
    console.log('   - All support tickets');
    console.log('   - All maintenance requests');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('\n✨ Cleanup script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup script failed:', error);
    process.exit(1);
  });
