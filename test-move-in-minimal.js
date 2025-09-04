#!/usr/bin/env node

/**
 * Minimal End-to-End Test for Move-In Issue Flow
 * 
 * This test verifies the core move-in issue functionality:
 * 1. Create a move-in issue directly
 * 2. View the issue
 * 3. Add comments
 * 4. Admin decision
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data
const testUsers = {
  tenant: {
    email: 'test-tenant@example.com',
    password: 'password123',
    name: 'Test Tenant',
    role: 'TENANT'
  },
  landlord: {
    email: 'test-landlord@example.com', 
    password: 'password123',
    name: 'Test Landlord',
    role: 'LANDLORD'
  },
  admin: {
    email: 'test-admin@example.com',
    password: 'password123', 
    name: 'Test Admin',
    role: 'ADMIN'
  }
};

let testData = {
  users: {},
  moveInIssue: null
};

// Helper function to create test users
const createTestUsers = async () => {
  console.log('👥 Creating test users...');
  
  for (const [role, userData] of Object.entries(testUsers)) {
    try {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userData.email,
            password: userData.password, // In real app, this would be hashed
            name: userData.name,
            role: userData.role
          }
        });
        console.log(`✅ Created ${role} user: ${userData.email}`);
      } else {
        console.log(`ℹ️  ${role} user already exists: ${userData.email}`);
      }
      
      testData.users[role] = user;
    } catch (error) {
      console.error(`❌ Error creating ${role} user:`, error.message);
      throw error;
    }
  }
};

// Test 1: Create move-in issue directly
const testCreateMoveInIssue = async () => {
  console.log('\n🧪 TEST 1: Create move-in issue');
  
  try {
    // Create a minimal offer first
    const offer = await prisma.offer.create({
      data: {
        description: 'Test offer for move-in issue testing',
        leaseStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        leaseEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        leaseDuration: 12,
        rentAmount: 1000,
        availableFrom: new Date(),
        status: 'ACCEPTED',
        paymentDate: new Date(),
        // Connect to existing landlord
        landlord: {
          connect: { id: testData.users.landlord.id }
        },
        // Create a minimal rental request
        rentalRequest: {
          create: {
            tenantId: testData.users.tenant.id,
            title: 'Test Rental Request',
            description: 'Test description',
            location: 'Test City',
            budget: 1000,
            moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE'
          }
        }
      }
    });
    
    console.log(`✅ Created test offer: ${offer.id}`);
    
    // Now create the move-in issue
    const moveInIssue = await prisma.moveInIssue.create({
      data: {
        offerId: offer.id,
        title: 'Test Move-In Issue - Broken Door',
        description: 'The front door is broken and needs repair before move-in',
        priority: 'HIGH',
        category: 'SAFETY',
        status: 'OPEN',
        reportedBy: testData.users.tenant.id
      }
    });
    
    testData.moveInIssue = moveInIssue;
    console.log(`✅ Created move-in issue: ${moveInIssue.id}`);
    console.log(`   Title: ${moveInIssue.title}`);
    console.log(`   Status: ${moveInIssue.status}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create move-in issue:', error.message);
    return false;
  }
};

// Test 2: View the issue
const testViewIssue = async () => {
  console.log('\n🧪 TEST 2: View the issue');
  
  try {
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: testData.moveInIssue.id },
      include: {
        comments: {
          include: {
            user: {
              select: { name: true, role: true }
            }
          }
        }
      }
    });
    
    if (issue) {
      console.log(`✅ Successfully viewed issue: ${issue.id}`);
      console.log(`   Title: ${issue.title}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   Comments: ${issue.comments?.length || 0}`);
      return true;
    } else {
      console.error('❌ Issue not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to view issue:', error.message);
    return false;
  }
};

// Test 3: Landlord adds comment
const testLandlordComment = async () => {
  console.log('\n🧪 TEST 3: Landlord adds comment');
  
  try {
    const comment = await prisma.moveInIssueComment.create({
      data: {
        moveInIssueId: testData.moveInIssue.id,
        userId: testData.users.landlord.id,
        content: 'I will arrange for the door repair immediately. A contractor will be there tomorrow morning.'
      }
    });
    
    console.log(`✅ Landlord added comment: ${comment.id}`);
    
    // Update issue status
    const updatedIssue = await prisma.moveInIssue.update({
      where: { id: testData.moveInIssue.id },
      data: { status: 'IN_PROGRESS' }
    });
    
    console.log(`✅ Updated issue status to: ${updatedIssue.status}`);
    return true;
  } catch (error) {
    console.error('❌ Failed landlord comment:', error.message);
    return false;
  }
};

// Test 4: Admin adds comment and makes decision
const testAdminDecision = async () => {
  console.log('\n🧪 TEST 4: Admin adds comment and makes decision');
  
  try {
    // Admin adds comment
    const comment = await prisma.moveInIssueComment.create({
      data: {
        moveInIssueId: testData.moveInIssue.id,
        userId: testData.users.admin.id,
        content: 'Issue reviewed. Door repair has been completed and verified. Issue can be marked as resolved.'
      }
    });
    
    console.log(`✅ Admin added comment: ${comment.id}`);
    
    // Admin makes decision
    const adminDecision = await prisma.moveInIssueAdminDecision.create({
      data: {
        moveInIssueId: testData.moveInIssue.id,
        adminId: testData.users.admin.id,
        decision: 'APPROVED',
        reasoning: 'Door repair completed successfully. Property is safe for move-in.',
        resolution: 'Issue resolved - door repaired and tested'
      }
    });
    
    console.log(`✅ Admin made decision: ${adminDecision.decision}`);
    console.log(`   Reasoning: ${adminDecision.reasoning}`);
    return true;
  } catch (error) {
    console.error('❌ Failed admin decision:', error.message);
    return false;
  }
};

// Test 5: Verify final state
const testVerifyFinalState = async () => {
  console.log('\n🧪 TEST 5: Verify final state');
  
  try {
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: testData.moveInIssue.id },
      include: {
        comments: {
          include: {
            user: {
              select: { name: true, role: true }
            }
          }
        },
        adminDecision: {
          include: {
            admin: {
              select: { name: true, role: true }
            }
          }
        }
      }
    });
    
    if (issue) {
      console.log(`✅ Final state verified:`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   Admin Decision: ${issue.adminDecision?.decision || 'None'}`);
      console.log(`   Total Comments: ${issue.comments?.length || 0}`);
      
      // Verify all expected data is present
      const hasLandlordComment = issue.comments?.some(c => c.user?.role === 'LANDLORD');
      const hasAdminComment = issue.comments?.some(c => c.user?.role === 'ADMIN');
      const hasAdminDecision = issue.adminDecision?.decision === 'APPROVED';
      
      if (hasLandlordComment && hasAdminComment && hasAdminDecision) {
        console.log(`✅ All expected data present - test PASSED`);
        return true;
      } else {
        console.error(`❌ Missing expected data:`);
        console.error(`   Landlord comment: ${hasLandlordComment}`);
        console.error(`   Admin comment: ${hasAdminComment}`);
        console.error(`   Admin decision: ${hasAdminDecision}`);
        return false;
      }
    } else {
      console.error('❌ Issue not found for final verification');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to verify final state:', error.message);
    return false;
  }
};

// Cleanup function
const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order to respect foreign key constraints
    if (testData.moveInIssue) {
      await prisma.moveInIssueComment.deleteMany({
        where: { moveInIssueId: testData.moveInIssue.id }
      });
      await prisma.moveInIssueAdminDecision.deleteMany({
        where: { moveInIssueId: testData.moveInIssue.id }
      });
      await prisma.moveInIssue.delete({
        where: { id: testData.moveInIssue.id }
      });
      console.log(`✅ Deleted test move-in issue: ${testData.moveInIssue.id}`);
    }
    
    // Clean up test users
    for (const [role, user] of Object.entries(testData.users)) {
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`✅ Deleted test user: ${user.email}`);
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
};

// Main test runner
const runE2ETest = async () => {
  console.log('🚀 Starting Minimal End-to-End Move-In Issue Test');
  console.log('==================================================');
  
  try {
    // Setup
    await createTestUsers();
    
    // Run tests
    const results = [];
    results.push(await testCreateMoveInIssue());
    results.push(await testViewIssue());
    results.push(await testLandlordComment());
    results.push(await testAdminDecision());
    results.push(await testVerifyFinalState());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Move-in issue flow is working correctly.');
    } else {
      console.log('❌ Some tests failed. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
};

// Run the test
runE2ETest();
