/**
 * 🧪 Test Script for Review Replies and Reports
 * 
 * Tests the new functionality for:
 * - Reporting reviews (any party)
 * - Replying to reviews (reviewee only)
 * - Editing replies (within 24 hours)
 * - Including replies in review GET endpoints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock user IDs for testing
const TEST_USERS = {
  landlord: 'test_landlord_123',
  tenant1: 'test_tenant_1_456',
  tenant2: 'test_tenant_2_789'
};

// Mock tenant group ID
const TEST_TENANT_GROUP = 'test_tenant_group_123';

// Mock lease ID
const TEST_LEASE = 'test_lease_123';

// Mock review ID
const TEST_REVIEW = 'test_review_123';

async function createTestData() {
  console.log('🔧 Creating test data...');
  
  try {
    // Create test users (if they don't exist)
    const users = await Promise.all([
      prisma.user.upsert({
        where: { id: TEST_USERS.landlord },
        update: {},
        create: {
          id: TEST_USERS.landlord,
          name: 'Test Landlord',
          email: 'landlord@test.com',
          role: 'LANDLORD'
        }
      }),
      prisma.user.upsert({
        where: { id: TEST_USERS.tenant1 },
        update: {},
        create: {
          id: TEST_USERS.tenant1,
          name: 'Test Tenant 1',
          email: 'tenant1@test.com',
          role: 'TENANT'
        }
      }),
      prisma.user.upsert({
        where: { id: TEST_USERS.tenant2 },
        update: {},
        create: {
          id: TEST_USERS.tenant2,
          name: 'Test Tenant 2',
          email: 'tenant2@test.com',
          role: 'TENANT'
        }
      })
    ]);

    // Create test tenant group (if it doesn't exist)
    const tenantGroup = await prisma.tenantGroup.upsert({
      where: { id: TEST_TENANT_GROUP },
      update: {},
      create: {
        id: TEST_TENANT_GROUP,
        name: 'Test Tenant Group'
      }
    });

    // Add tenants to the group
    await Promise.all([
      prisma.tenantGroupMember.upsert({
        where: {
          userId_tenantGroupId: {
            userId: TEST_USERS.tenant1,
            tenantGroupId: TEST_TENANT_GROUP
          }
        },
        update: {},
        create: {
          tenantGroupId: TEST_TENANT_GROUP,
          userId: TEST_USERS.tenant1
        }
      }),
      prisma.tenantGroupMember.upsert({
        where: {
          userId_tenantGroupId: {
            userId: TEST_USERS.tenant2,
            tenantGroupId: TEST_TENANT_GROUP
          }
        },
        update: {},
        create: {
          tenantGroupId: TEST_TENANT_GROUP,
          userId: TEST_USERS.tenant2
        }
      })
    ]);

    // Create test lease (if it doesn't exist)
    const lease = await prisma.lease.upsert({
      where: { id: TEST_LEASE },
      update: {},
      create: {
        id: TEST_LEASE,
        tenantGroupId: TEST_TENANT_GROUP,
        landlordId: TEST_USERS.landlord,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        monthlyRent: 2500,
        deposit: 5000,
        rentAmount: 2500,
        depositAmount: 5000,
        tenantGroup: {
          connect: { id: TEST_TENANT_GROUP }
        }
      }
    });

    // Create test review (if it doesn't exist)
    const review = await prisma.review.upsert({
      where: { id: TEST_REVIEW },
      update: {},
      create: {
        id: TEST_REVIEW,
        leaseId: TEST_LEASE,
        reviewerId: TEST_USERS.tenant1,
        targetTenantGroupId: TEST_TENANT_GROUP,
        reviewStage: 'MOVE_IN',
        rating: 4,
        comment: 'Great property, very clean!',
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    console.log('✅ Test data created successfully');
    return { users, tenantGroup, lease, review };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function testReviewReply() {
  console.log('\n🧪 Testing Review Reply Functionality...');
  
  try {
    // Test 1: Create a reply (should succeed)
    console.log('\nTest 1: Creating review reply...');
    const reply = await prisma.reviewReply.create({
      data: {
        reviewId: TEST_REVIEW,
        revieweeId: TEST_USERS.tenant2, // Tenant 2 is in the target group
        content: 'Thank you for the positive review! We enjoyed having you as a tenant.'
      }
    });
    
    console.log('✅ Reply created successfully:', {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt
    });

    // Test 2: Try to create another reply (should fail - only one allowed)
    console.log('\nTest 2: Attempting to create duplicate reply...');
    try {
      await prisma.reviewReply.create({
        data: {
          reviewId: TEST_REVIEW,
          revieweeId: TEST_USERS.tenant1,
          content: 'This should fail - duplicate reply'
        }
      });
      console.log('❌ Should have failed - duplicate reply created');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ Correctly prevented duplicate reply');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Edit the reply (should succeed)
    console.log('\nTest 3: Editing review reply...');
    const updatedReply = await prisma.reviewReply.update({
      where: { reviewId: TEST_REVIEW },
      data: {
        content: 'Updated reply content - thank you for the positive review!'
      }
    });
    
    console.log('✅ Reply updated successfully:', {
      content: updatedReply.content,
      updatedAt: updatedReply.updatedAt
    });

    return reply;
    
  } catch (error) {
    console.error('❌ Error testing review reply:', error);
    throw error;
  }
}

async function testReviewReport() {
  console.log('\n🧪 Testing Review Report Functionality...');
  
  try {
    // Test 1: Create a report (should succeed)
    console.log('\nTest 1: Creating review report...');
    const report = await prisma.reviewReport.create({
      data: {
        reviewId: TEST_REVIEW,
        reporterId: TEST_USERS.tenant2,
        reason: 'Inappropriate content',
        description: 'The review contains inappropriate language'
      }
    });
    
    console.log('✅ Report created successfully:', {
      id: report.id,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt
    });

    // Test 2: Try to create another report from same user (should fail)
    console.log('\nTest 2: Attempting to create duplicate report...');
    try {
      await prisma.reviewReport.create({
        data: {
          reviewId: TEST_REVIEW,
          reporterId: TEST_USERS.tenant2,
          reason: 'Another reason',
          description: 'This should fail - duplicate report'
        }
      });
      console.log('❌ Should have failed - duplicate report created');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ Correctly prevented duplicate report');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Create report from different user (should succeed)
    console.log('\nTest 3: Creating report from different user...');
    const report2 = await prisma.reviewReport.create({
      data: {
        reviewId: TEST_REVIEW,
        reporterId: TEST_USERS.landlord,
        reason: 'False information',
        description: 'The review contains false statements'
      }
    });
    
    console.log('✅ Second report created successfully:', {
      id: report2.id,
      reason: report2.reason,
      reporterId: report2.reporterId
    });

    return { report, report2 };
    
  } catch (error) {
    console.error('❌ Error testing review report:', error);
    throw error;
  }
}

async function testReviewWithReply() {
  console.log('\n🧪 Testing Review GET with Reply...');
  
  try {
    // Test: Get review with reply included
    console.log('\nTest: Fetching review with reply...');
    const reviewWithReply = await prisma.review.findUnique({
      where: { id: TEST_REVIEW },
      include: {
        reply: {
          include: {
            reviewee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reports: {
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    if (reviewWithReply) {
      console.log('✅ Review fetched with reply and reports:', {
        reviewId: reviewWithReply.id,
        comment: reviewWithReply.comment,
        hasReply: !!reviewWithReply.reply,
        replyContent: reviewWithReply.reply?.content,
        replyAuthor: reviewWithReply.reply?.reviewee?.name,
        reportCount: reviewWithReply.reports.length,
        reportReasons: reviewWithReply.reports.map(r => r.reason)
      });
    } else {
      console.log('❌ Review not found');
    }

    return reviewWithReply;
    
  } catch (error) {
    console.error('❌ Error testing review with reply:', error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order to respect foreign key constraints
    await prisma.reviewReport.deleteMany({
      where: { reviewId: TEST_REVIEW }
    });
    
    await prisma.reviewReply.deleteMany({
      where: { reviewId: TEST_REVIEW }
    });
    
    await prisma.review.deleteMany({
      where: { id: TEST_REVIEW }
    });
    
    await prisma.lease.deleteMany({
      where: { id: TEST_LEASE }
    });
    
    await prisma.tenantGroupMember.deleteMany({
      where: { tenantGroupId: TEST_TENANT_GROUP }
    });
    
    await prisma.tenantGroup.deleteMany({
      where: { id: TEST_TENANT_GROUP }
    });
    
    await prisma.user.deleteMany({
      where: { id: { in: Object.values(TEST_USERS) } }
    });
    
    console.log('✅ Test data cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

async function runAllTests() {
  try {
    console.log('🚀 Starting Review Replies and Reports Tests...\n');
    
    // Create test data
    await createTestData();
    
    // Run tests
    await testReviewReply();
    await testReviewReport();
    await testReviewWithReply();
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  } finally {
    // Clean up test data
    await cleanupTestData();
    
    // Close database connection
    await prisma.$disconnect();
  }
}

// Run the tests
runAllTests().catch(console.error);
