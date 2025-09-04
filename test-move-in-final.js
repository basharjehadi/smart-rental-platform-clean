#!/usr/bin/env node

/**
 * Final Test for Move-In Issue Flow
 * 
 * This test verifies the move-in issue functionality using the existing backend setup
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import Prisma from the backend
const { PrismaClient } = require(join(__dirname, 'backend', 'node_modules', '@prisma', 'client'));

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

// Test 1: Create test users
const testCreateUsers = async () => {
  console.log('🧪 TEST 1: Create test users');
  
  try {
    for (const [role, userData] of Object.entries(testUsers)) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role
          }
        });
        console.log(`✅ Created ${role} user: ${userData.email}`);
      } else {
        console.log(`ℹ️  ${role} user already exists: ${userData.email}`);
      }
      
      testData.users[role] = user;
    }
    
    console.log(`✅ All test users created successfully`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test users:', error.message);
    return false;
  }
};

// Test 2: Test MoveInIssue model
const testMoveInIssueModel = async () => {
  console.log('\n🧪 TEST 2: Test MoveInIssue model');
  
  try {
    // Try to count move-in issues
    const issueCount = await prisma.moveInIssue.count();
    console.log(`✅ MoveInIssue model exists, count: ${issueCount}`);
    
    // First create a tenant group (required for lease)
    const tenantGroup = await prisma.tenantGroup.create({
      data: {
        name: 'Test Tenant Group'
      }
    });
    
    console.log(`✅ Created test tenant group: ${tenantGroup.id}`);
    
    // Add tenant to the group
    await prisma.tenantGroupMember.create({
      data: {
        tenantGroupId: tenantGroup.id,
        userId: testData.users.tenant.id
      }
    });
    
    // Now create a lease (required for MoveInIssue)
    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 1000,
        rentAmount: 1000,
        depositAmount: 1000,
        status: 'ACTIVE',
        tenantId: testData.users.tenant.id,
        landlordId: testData.users.landlord.id,
        tenantGroup: {
          connect: { id: tenantGroup.id }
        }
      }
    });
    
    console.log(`✅ Created test lease: ${lease.id}`);
    
    // Now create a move-in issue
    const testIssue = await prisma.moveInIssue.create({
      data: {
        title: 'Test Issue',
        description: 'Test description',
        status: 'OPEN',
        leaseId: lease.id
      }
    });
    
    console.log(`✅ Created test move-in issue: ${testIssue.id}`);
    testData.moveInIssue = testIssue;
    testData.lease = lease;
    testData.tenantGroup = tenantGroup;
    return true;
  } catch (error) {
    console.error('❌ MoveInIssue model test failed:', error.message);
    return false;
  }
};

// Test 3: Test MoveInIssueComment model
const testMoveInIssueCommentModel = async () => {
  console.log('\n🧪 TEST 3: Test MoveInIssueComment model');
  
  try {
    // Try to create a comment
    const comment = await prisma.moveInIssueComment.create({
      data: {
        issueId: testData.moveInIssue.id,
        authorId: testData.users.landlord.id,
        content: 'Test comment from landlord'
      }
    });
    
    console.log(`✅ Created test comment: ${comment.id}`);
    return true;
  } catch (error) {
    console.error('❌ MoveInIssueComment model test failed:', error.message);
    return false;
  }
};

// Test 4: Test MoveInIssueAdminDecision model
const testMoveInIssueAdminDecisionModel = async () => {
  console.log('\n🧪 TEST 4: Test MoveInIssueAdminDecision model');
  
  try {
    // Try to create an admin decision
    const decision = await prisma.moveInIssueAdminDecision.create({
      data: {
        issueId: testData.moveInIssue.id,
        adminId: testData.users.admin.id,
        decision: 'APPROVED',
        reasoning: 'Test approval reasoning',
        resolution: 'Test resolution'
      }
    });
    
    console.log(`✅ Created test admin decision: ${decision.id}`);
    return true;
  } catch (error) {
    console.error('❌ MoveInIssueAdminDecision model test failed:', error.message);
    return false;
  }
};

// Test 5: Test complete workflow
const testCompleteWorkflow = async () => {
  console.log('\n🧪 TEST 5: Test complete workflow');
  
  try {
    // Get the issue with all related data
    const issue = await prisma.moveInIssue.findUnique({
      where: { id: testData.moveInIssue.id },
      include: {
        comments: {
          include: {
            author: {
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
      console.log(`✅ Complete workflow test successful:`);
      console.log(`   Issue: ${issue.title}`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   Comments: ${issue.comments?.length || 0}`);
      console.log(`   Admin Decision: ${issue.adminDecision?.decision || 'None'}`);
      
      // Verify all expected data is present
      const hasLandlordComment = issue.comments?.some(c => c.author?.role === 'LANDLORD');
      const hasAdminDecision = issue.adminDecision?.decision === 'APPROVED';
      
      if (hasLandlordComment && hasAdminDecision) {
        console.log(`✅ All expected data present - workflow PASSED`);
        return true;
      } else {
        console.error(`❌ Missing expected data:`);
        console.error(`   Landlord comment: ${hasLandlordComment}`);
        console.error(`   Admin decision: ${hasAdminDecision}`);
        return false;
      }
    } else {
      console.error('❌ Issue not found for workflow test');
      return false;
    }
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error.message);
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
        where: { issueId: testData.moveInIssue.id }
      });
      await prisma.moveInIssueAdminDecision.deleteMany({
        where: { issueId: testData.moveInIssue.id }
      });
      await prisma.moveInIssue.delete({
        where: { id: testData.moveInIssue.id }
      });
      console.log(`✅ Deleted test move-in issue: ${testData.moveInIssue.id}`);
    }
    
    if (testData.lease) {
      await prisma.lease.delete({
        where: { id: testData.lease.id }
      });
      console.log(`✅ Deleted test lease: ${testData.lease.id}`);
    }
    
    if (testData.tenantGroup) {
      await prisma.tenantGroupMember.deleteMany({
        where: { tenantGroupId: testData.tenantGroup.id }
      });
      await prisma.tenantGroup.delete({
        where: { id: testData.tenantGroup.id }
      });
      console.log(`✅ Deleted test tenant group: ${testData.tenantGroup.id}`);
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
const runFinalTest = async () => {
  console.log('🚀 Starting Final Move-In Issue Test');
  console.log('=====================================');
  
  try {
    // Run tests
    const results = [];
    results.push(await testCreateUsers());
    results.push(await testMoveInIssueModel());
    results.push(await testMoveInIssueCommentModel());
    results.push(await testMoveInIssueAdminDecisionModel());
    results.push(await testCompleteWorkflow());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Move-in issue system is working correctly.');
      console.log('✅ The complete move-in issue workflow is functional.');
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
runFinalTest();
