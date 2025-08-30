/**
 * 🧪 Test Script for Review Signals Service
 *
 * This script tests the new review signals service functionality.
 * Run with: node test-review-signals.js
 */

import { PrismaClient } from '@prisma/client';
import {
  createReviewSignal,
  getLeaseReviewSignals,
  getTenantGroupReviewSignals,
  getReviewSignalsByType,
  getReviewSignalStats,
  cleanupOldReviewSignals,
} from './src/services/reviewSignalService.js';

const prisma = new PrismaClient();

// Test data
const testData = {
  leaseId: 'test-lease-signals-123',
  tenantGroupId: 'test-tenant-group-signals-456',
  userId: 'test-user-signals-789',
};

/**
 * Create test data for signals testing
 */
async function createTestData() {
  console.log('🔧 Creating test data for review signals...');

  try {
    // Create test user
    const user = await prisma.user.upsert({
      where: { id: testData.userId },
      update: {},
      create: {
        id: testData.userId,
        name: 'Test User Signals',
        email: 'test-signals@example.com',
        password: 'hashedpassword',
        role: 'TENANT',
      },
    });

    // Create test tenant group
    const tenantGroup = await prisma.tenantGroup.upsert({
      where: { id: testData.tenantGroupId },
      update: {},
      create: {
        id: testData.tenantGroupId,
        name: 'Test Tenant Group Signals',
      },
    });

    // Create tenant group member
    await prisma.tenantGroupMember.upsert({
      where: {
        tenantGroupId_userId: {
          tenantGroupId: testData.tenantGroupId,
          userId: testData.userId,
        },
      },
      update: {},
      create: {
        tenantGroupId: testData.tenantGroupId,
        userId: testData.userId,
        role: 'TENANT',
      },
    });

    // Create test lease
    const lease = await prisma.lease.upsert({
      where: { id: testData.leaseId },
      update: {},
      create: {
        id: testData.leaseId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-01-01'),
        status: 'ACTIVE',
        tenantGroupId: testData.tenantGroupId,
      },
    });

    console.log('✅ Test data created successfully');
    return { user, tenantGroup, lease };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

/**
 * Test creating review signals
 */
async function testCreateReviewSignals() {
  console.log('\n🧪 Testing review signal creation...\n');

  try {
    // Test 1: Create PAYMENT_CONFIRMED signal
    console.log('1️⃣ Creating PAYMENT_CONFIRMED signal...');
    const paymentSignal = await createReviewSignal({
      signalType: 'PAYMENT_CONFIRMED',
      leaseId: testData.leaseId,
      tenantGroupId: testData.tenantGroupId,
      metadata: {
        amount: 2500.0,
        purpose: 'DEPOSIT_AND_FIRST_MONTH',
        paymentIntentId: 'pi_test_123',
        currency: 'PLN',
      },
    });
    console.log('   ✅ Payment signal created:', paymentSignal.id);

    // Test 2: Create DEPOSIT_RETURNED signal
    console.log('\n2️⃣ Creating DEPOSIT_RETURNED signal...');
    const depositSignal = await createReviewSignal({
      signalType: 'DEPOSIT_RETURNED',
      leaseId: testData.leaseId,
      tenantGroupId: testData.tenantGroupId,
      metadata: {
        amount: 2000.0,
        returnDate: new Date().toISOString(),
        deductions: 500.0,
        reason: 'Property damage',
      },
    });
    console.log('   ✅ Deposit signal created:', depositSignal.id);

    return { paymentSignal, depositSignal };
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test retrieving review signals
 */
async function testRetrieveReviewSignals() {
  console.log('\n🧪 Testing review signal retrieval...\n');

  try {
    // Test 1: Get signals for lease
    console.log('1️⃣ Getting signals for lease...');
    const leaseSignals = await getLeaseReviewSignals(testData.leaseId);
    console.log(`   ✅ Found ${leaseSignals.length} signals for lease`);

    // Test 2: Get signals for tenant group
    console.log('\n2️⃣ Getting signals for tenant group...');
    const groupSignals = await getTenantGroupReviewSignals(
      testData.tenantGroupId
    );
    console.log(`   ✅ Found ${groupSignals.length} signals for tenant group`);

    // Test 3: Get signals by type
    console.log('\n3️⃣ Getting signals by type...');
    const paymentSignals = await getReviewSignalsByType('PAYMENT_CONFIRMED');
    console.log(
      `   ✅ Found ${paymentSignals.signals.length} PAYMENT_CONFIRMED signals`
    );

    const depositSignals = await getReviewSignalsByType('DEPOSIT_RETURNED');
    console.log(
      `   ✅ Found ${depositSignals.signals.length} DEPOSIT_RETURNED signals`
    );

    return { leaseSignals, groupSignals, paymentSignals, depositSignals };
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test review signal statistics
 */
async function testReviewSignalStats() {
  console.log('\n🧪 Testing review signal statistics...\n');

  try {
    const stats = await getReviewSignalStats({
      leaseId: testData.leaseId,
      tenantGroupId: testData.tenantGroupId,
    });

    console.log('📊 Review signal statistics:');
    console.log(`   Total signals: ${stats.totalSignals}`);
    console.log(`   Payment confirmed: ${stats.paymentConfirmed}`);
    console.log(`   Deposit returned: ${stats.depositReturned}`);
    console.log(`   Payment %: ${stats.breakdown.paymentConfirmed}%`);
    console.log(`   Deposit %: ${stats.breakdown.depositReturned}%`);

    return stats;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test cleanup function
 */
async function testCleanupFunction() {
  console.log('\n🧪 Testing cleanup function...\n');

  try {
    // This won't actually delete our test signals since they're new
    const deletedCount = await cleanupOldReviewSignals(24);
    console.log(
      `   ✅ Cleanup function executed, deleted ${deletedCount} old signals`
    );

    return deletedCount;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete test signals
    await prisma.reviewSignal.deleteMany({
      where: {
        leaseId: testData.leaseId,
      },
    });

    // Delete tenant group member
    await prisma.tenantGroupMember.deleteMany({
      where: {
        tenantGroupId: testData.tenantGroupId,
      },
    });

    // Delete lease
    await prisma.lease.delete({
      where: { id: testData.leaseId },
    });

    // Delete tenant group
    await prisma.tenantGroup.delete({
      where: { id: testData.tenantGroupId },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: testData.userId },
    });

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Review Signals Service Tests\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Setup
    await createTestData();

    // Run tests
    await testCreateReviewSignals();
    await testRetrieveReviewSignals();
    await testReviewSignalStats();
    await testCleanupFunction();

    console.log('\n🎯 Test Summary:');
    console.log('✅ Review signal creation');
    console.log('✅ Signal retrieval by lease and tenant group');
    console.log('✅ Signal filtering by type');
    console.log('✅ Statistics generation');
    console.log('✅ Cleanup function');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export {
  testCreateReviewSignals,
  testRetrieveReviewSignals,
  testReviewSignalStats,
  testCleanupFunction,
};
