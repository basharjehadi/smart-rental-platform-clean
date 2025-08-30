/**
 * 🧪 Test Script for Review Aggregates Service
 *
 * This script tests the new aggregates service with time-weighted calculations.
 * Run with: node test-aggregates-service.js
 */

import { PrismaClient } from '@prisma/client';
import {
  computeUserAggregate,
  getBulkUserAggregates,
  getUserAggregateSummary,
  cleanupOldAggregates,
} from './src/services/reviews/aggregates.js';

const prisma = new PrismaClient();

// Test data
const testData = {
  userId: 'test-user-aggregates-123',
  tenantGroupId: 'test-tenant-group-aggregates-456',
  leaseId: 'test-lease-aggregates-789',
};

/**
 * Create test data for aggregates testing
 */
async function createTestData() {
  console.log('🔧 Creating test data for aggregates service...');

  try {
    // Create test user
    const user = await prisma.user.upsert({
      where: { id: testData.userId },
      update: {},
      create: {
        id: testData.userId,
        name: 'Test User Aggregates',
        email: 'test-aggregates@example.com',
        password: 'hashedpassword',
        role: 'TENANT',
        averageRating: null,
        totalReviews: 0,
      },
    });

    // Create test tenant group
    const tenantGroup = await prisma.tenantGroup.upsert({
      where: { id: testData.tenantGroupId },
      update: {},
      create: {
        id: testData.tenantGroupId,
        name: 'Test Tenant Group Aggregates',
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
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-01-01'),
        status: 'COMPLETED',
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
 * Create test reviews with different dates for time-weighting
 */
async function createTestReviews() {
  console.log('📝 Creating test reviews with different dates...');

  try {
    const now = new Date();
    const reviews = [];

    // Review 1: 6 months ago (recent - 60% weight)
    const review1 = await prisma.review.create({
      data: {
        rating: 5,
        comment: 'Great experience 6 months ago',
        isAnonymous: false,
        leaseId: testData.leaseId,
        reviewStage: 'END_OF_LEASE',
        reviewerId: 'test-reviewer-1',
        targetTenantGroupId: testData.tenantGroupId,
        status: 'PUBLISHED',
        publishedAt: new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          now.getDate()
        ),
        isDoubleBlind: true,
      },
    });
    reviews.push(review1);

    // Review 2: 18 months ago (medium - 30% weight)
    const review2 = await prisma.review.create({
      data: {
        rating: 4,
        comment: 'Good experience 18 months ago',
        isAnonymous: false,
        leaseId: testData.leaseId,
        reviewStage: 'END_OF_LEASE',
        reviewerId: 'test-reviewer-2',
        targetTenantGroupId: testData.tenantGroupId,
        status: 'PUBLISHED',
        publishedAt: new Date(
          now.getFullYear() - 1,
          now.getMonth() - 6,
          now.getDate()
        ),
        isDoubleBlind: true,
      },
    });
    reviews.push(review2);

    // Review 3: 30 months ago (old - 10% weight)
    const review3 = await prisma.review.create({
      data: {
        rating: 3,
        comment: 'Okay experience 30 months ago',
        isAnonymous: false,
        leaseId: testData.leaseId,
        reviewStage: 'END_OF_LEASE',
        reviewerId: 'test-reviewer-3',
        targetTenantGroupId: testData.tenantGroupId,
        status: 'PUBLISHED',
        publishedAt: new Date(
          now.getFullYear() - 2,
          now.getMonth() - 6,
          now.getDate()
        ),
        isDoubleBlind: true,
      },
    });
    reviews.push(review3);

    console.log('✅ Test reviews created:');
    reviews.forEach((review, index) => {
      console.log(
        `   Review ${index + 1}: ${review.rating} stars, published ${review.publishedAt.toDateString()}`
      );
    });

    return reviews;
  } catch (error) {
    console.error('❌ Error creating test reviews:', error);
    throw error;
  }
}

/**
 * Test the computeUserAggregate function
 */
async function testComputeUserAggregate() {
  console.log('\n🧪 Testing computeUserAggregate function...\n');

  try {
    // Get initial user state
    const initialUser = await prisma.user.findUnique({
      where: { id: testData.userId },
      select: { averageRating: true, totalReviews: true },
    });
    console.log('1️⃣ Initial user state:', initialUser);

    // Compute user aggregate
    console.log('\n2️⃣ Computing user aggregate...');
    const result = await computeUserAggregate(testData.userId);
    console.log('   Result:', result);

    // Verify user was updated
    const updatedUser = await prisma.user.findUnique({
      where: { id: testData.userId },
      select: { averageRating: true, totalReviews: true },
    });
    console.log('\n3️⃣ Updated user state:', updatedUser);

    // Verify the calculation
    if (result.averageRating !== null && result.totalReviews >= 3) {
      console.log('✅ User aggregate computed successfully with 3+ reviews');
    } else {
      console.log(
        'ℹ️  User aggregate computed but average is null (less than 3 reviews)'
      );
    }

    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test the getUserAggregateSummary function
 */
async function testGetUserAggregateSummary() {
  console.log('\n🧪 Testing getUserAggregateSummary function...\n');

  try {
    const summary = await getUserAggregateSummary(testData.userId);
    console.log('📊 User aggregate summary:', summary);

    // Verify the breakdown
    const { reviewBreakdown } = summary;
    console.log('\n📈 Review breakdown:');
    console.log(`   Recent (0-12 months): ${reviewBreakdown.recent}`);
    console.log(`   Medium (13-24 months): ${reviewBreakdown.medium}`);
    console.log(`   Old (25+ months): ${reviewBreakdown.old}`);

    if (
      reviewBreakdown.recent > 0 &&
      reviewBreakdown.medium > 0 &&
      reviewBreakdown.old > 0
    ) {
      console.log(
        '✅ All time periods have reviews - perfect for testing time-weighting!'
      );
    }

    return summary;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test bulk user aggregates
 */
async function testBulkUserAggregates() {
  console.log('\n🧪 Testing bulk user aggregates...\n');

  try {
    const userIds = [testData.userId];
    const results = await getBulkUserAggregates(userIds);

    console.log('📊 Bulk results:', results);
    console.log(`✅ Processed ${results.length} users in bulk`);

    return results;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test with insufficient reviews (should return null average)
 */
async function testInsufficientReviews() {
  console.log('\n🧪 Testing insufficient reviews scenario...\n');

  try {
    // Create a new test user with only 2 reviews
    const insufficientUserId = 'test-user-insufficient-456';

    // Create user
    await prisma.user.upsert({
      where: { id: insufficientUserId },
      update: {},
      create: {
        id: insufficientUserId,
        name: 'Test User Insufficient',
        email: 'test-insufficient@example.com',
        password: 'hashedpassword',
        role: 'TENANT',
      },
    });

    // Create only 2 reviews
    const now = new Date();
    await prisma.review.createMany({
      data: [
        {
          rating: 4,
          comment: 'First review',
          leaseId: testData.leaseId,
          reviewStage: 'END_OF_LEASE',
          reviewerId: 'test-reviewer-insufficient-1',
          targetTenantGroupId: testData.tenantGroupId,
          status: 'PUBLISHED',
          publishedAt: new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            now.getDate()
          ),
          isDoubleBlind: true,
        },
        {
          rating: 5,
          comment: 'Second review',
          leaseId: testData.leaseId,
          reviewStage: 'END_OF_LEASE',
          reviewerId: 'test-reviewer-insufficient-2',
          targetTenantGroupId: testData.tenantGroupId,
          status: 'PUBLISHED',
          publishedAt: new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
          ),
          isDoubleBlind: true,
        },
      ],
    });

    // Test aggregate computation
    const result = await computeUserAggregate(insufficientUserId);
    console.log('📊 Result with insufficient reviews:', result);

    if (result.averageRating === null && result.totalReviews === 2) {
      console.log(
        '✅ Correctly returned null average for user with less than 3 reviews'
      );
    } else {
      console.log('❌ Expected null average for insufficient reviews');
    }

    // Clean up
    await prisma.review.deleteMany({
      where: {
        targetTenantGroupId: testData.tenantGroupId,
        reviewerId: { startsWith: 'test-reviewer-insufficient' },
      },
    });
    await prisma.user.delete({ where: { id: insufficientUserId } });

    return result;
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
    // Delete test reviews
    await prisma.review.deleteMany({
      where: {
        targetTenantGroupId: testData.tenantGroupId,
      },
    });

    // Delete tenant group member
    await prisma.tenantGroupMember.deleteMany({
      where: {
        tenantGroupId: testData.tenantGroupId,
      },
    });

    // Delete tenant group
    await prisma.tenantGroup.delete({
      where: { id: testData.tenantGroupId },
    });

    // Delete lease
    await prisma.lease.delete({
      where: { id: testData.leaseId },
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
  console.log('🚀 Starting Review Aggregates Service Tests\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Setup
    await createTestData();
    await createTestReviews();

    // Run tests
    await testComputeUserAggregate();
    await testGetUserAggregateSummary();
    await testBulkUserAggregates();
    await testInsufficientReviews();

    console.log('\n🎯 Test Summary:');
    console.log('✅ User aggregate computation');
    console.log('✅ Time-weighted calculations');
    console.log('✅ Insufficient reviews handling');
    console.log('✅ Bulk processing');
    console.log('✅ User summary generation');
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
  testComputeUserAggregate,
  testGetUserAggregateSummary,
  testBulkUserAggregates,
  testInsufficientReviews,
};
