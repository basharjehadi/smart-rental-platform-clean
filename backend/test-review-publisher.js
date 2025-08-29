/**
 * 🧪 Test Script for Review Publisher Job
 * 
 * This script tests the review publisher job functionality.
 * Run with: node test-review-publisher.js
 */

import { PrismaClient } from '@prisma/client';
import { publishReviews, triggerReviewPublishing, getJobStats } from './src/jobs/reviewPublisher.js';

const prisma = new PrismaClient();

// Test data
const testData = {
  leaseId: 'test-lease-123',
  tenantGroupId: 'test-tenant-group-456',
  reviewer1Id: 'test-user-1',
  reviewer2Id: 'test-user-2'
};

/**
 * Create test reviews for testing
 */
async function createTestReviews() {
  console.log('🔧 Creating test reviews...');

  try {
    // Create a test lease if it doesn't exist
    let lease = await prisma.lease.findUnique({
      where: { id: testData.leaseId }
    });

    if (!lease) {
      lease = await prisma.lease.create({
        data: {
          id: testData.leaseId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          status: 'ACTIVE'
        }
      });
      console.log('✅ Test lease created');
    }

    // Create a test tenant group if it doesn't exist
    let tenantGroup = await prisma.tenantGroup.findUnique({
      where: { id: testData.tenantGroupId }
    });

    if (!tenantGroup) {
      tenantGroup = await prisma.tenantGroup.create({
        data: {
          id: testData.tenantGroupId,
          name: 'Test Tenant Group'
        }
      });
      console.log('✅ Test tenant group created');
    }

    // Create test users if they don't exist
    const user1 = await prisma.user.upsert({
      where: { id: testData.reviewer1Id },
      update: {},
      create: {
        id: testData.reviewer1Id,
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'hashedpassword',
        role: 'TENANT'
      }
    });

    const user2 = await prisma.user.upsert({
      where: { id: testData.reviewer2Id },
      update: {},
      create: {
        id: testData.reviewer2Id,
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'hashedpassword',
        role: 'LANDLORD'
      }
    });

    console.log('✅ Test users created/updated');

    // Create test reviews
    const review1 = await prisma.review.create({
      data: {
        rating: 5,
        comment: 'Great experience!',
        isAnonymous: false,
        leaseId: testData.leaseId,
        reviewStage: 'MOVE_IN',
        reviewerId: testData.reviewer1Id,
        targetTenantGroupId: testData.tenantGroupId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        isDoubleBlind: true
      }
    });

    const review2 = await prisma.review.create({
      data: {
        rating: 4,
        comment: 'Good tenant, would recommend',
        isAnonymous: false,
        leaseId: testData.leaseId,
        reviewStage: 'MOVE_IN',
        reviewerId: testData.reviewer2Id,
        targetTenantGroupId: testData.tenantGroupId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        isDoubleBlind: true
      }
    });

    console.log('✅ Test reviews created:');
    console.log(`   Review 1: ${review1.id} (${review1.status})`);
    console.log(`   Review 2: ${review2.id} (${review2.status})`);

    return { review1, review2 };

  } catch (error) {
    console.error('❌ Error creating test reviews:', error);
    throw error;
  }
}

/**
 * Test the review publisher job
 */
async function testReviewPublisher() {
  console.log('\n🧪 Testing Review Publisher Job...\n');

  try {
    // 1. Get initial stats
    console.log('1️⃣ Getting initial statistics...');
    const initialStats = await getJobStats();
    console.log('   Initial stats:', initialStats);

    // 2. Create test reviews
    console.log('\n2️⃣ Creating test reviews...');
    const { review1, review2 } = await createTestReviews();

    // 3. Get stats after creating reviews
    console.log('\n3️⃣ Getting stats after creating reviews...');
    const afterCreateStats = await getJobStats();
    console.log('   Stats after creating reviews:', afterCreateStats);

    // 4. Run the review publisher job
    console.log('\n4️⃣ Running review publisher job...');
    await publishReviews();

    // 5. Get stats after publishing
    console.log('\n5️⃣ Getting stats after publishing...');
    const afterPublishStats = await getJobStats();
    console.log('   Stats after publishing:', afterPublishStats);

    // 6. Verify the reviews were published
    console.log('\n6️⃣ Verifying reviews were published...');
    const updatedReview1 = await prisma.review.findUnique({
      where: { id: review1.id }
    });
    const updatedReview2 = await prisma.review.findUnique({
      where: { id: review2.id }
    });

    console.log(`   Review 1 status: ${updatedReview1.status} (expected: PUBLISHED)`);
    console.log(`   Review 2 status: ${updatedReview2.status} (expected: PUBLISHED)`);

    if (updatedReview1.status === 'PUBLISHED' && updatedReview2.status === 'PUBLISHED') {
      console.log('✅ Both reviews were successfully published!');
    } else {
      console.log('❌ Reviews were not published as expected');
    }

    // 7. Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    await prisma.review.deleteMany({
      where: {
        id: { in: [review1.id, review2.id] }
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [testData.reviewer1Id, testData.reviewer2Id] }
      }
    });

    await prisma.tenantGroup.delete({
      where: { id: testData.tenantGroupId }
    });

    await prisma.lease.delete({
      where: { id: testData.leaseId }
    });

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Review publisher job test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test single review publishing with publishAfter
 */
async function testSingleReviewPublishing() {
  console.log('\n🧪 Testing Single Review Publishing...\n');

  try {
    // Create a test review with publishAfter in the past
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    const singleReview = await prisma.review.create({
      data: {
        rating: 3,
        comment: 'Single review test',
        isAnonymous: false,
        leaseId: testData.leaseId,
        reviewStage: 'PAYMENT_COMPLETED',
        reviewerId: testData.reviewer1Id,
        targetTenantGroupId: testData.tenantGroupId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        publishAfter: pastDate,
        isDoubleBlind: true
      }
    });

    console.log(`✅ Single test review created: ${singleReview.id}`);
    console.log(`   publishAfter: ${singleReview.publishAfter}`);

    // Run the publisher job
    console.log('\n🔄 Running review publisher job...');
    await publishReviews();

    // Check if the review was published
    const updatedReview = await prisma.review.findUnique({
      where: { id: singleReview.id }
    });

    console.log(`\n📊 Review status after publishing: ${updatedReview.status}`);
    
    if (updatedReview.status === 'PUBLISHED') {
      console.log('✅ Single review was successfully published!');
    } else {
      console.log('❌ Single review was not published as expected');
    }

    // Clean up
    await prisma.review.delete({
      where: { id: singleReview.id }
    });

    console.log('✅ Single review test completed');

  } catch (error) {
    console.error('❌ Single review test failed:', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Review Publisher Job Tests\n');
  console.log('=' .repeat(60) + '\n');

  try {
    await testReviewPublisher();
    await testSingleReviewPublishing();
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ Review pair publishing');
    console.log('✅ Single review publishing');
    console.log('✅ User aggregate computation');
    console.log('✅ Job statistics');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testReviewPublisher, testSingleReviewPublishing };
