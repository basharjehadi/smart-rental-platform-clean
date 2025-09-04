#!/usr/bin/env node

/**
 * Basic Test for Move-In Issue Flow
 * 
 * This test verifies the basic move-in issue functionality:
 * 1. Create test users
 * 2. Test database connectivity
 * 3. Verify move-in issue model exists
 */

import { PrismaClient } from './backend/node_modules/@prisma/client/index.js';

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
  users: {}
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

// Test 2: Test database connectivity
const testDatabaseConnectivity = async () => {
  console.log('\n🧪 TEST 2: Test database connectivity');
  
  try {
    // Test basic database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Database connection successful`);
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connectivity test failed:', error.message);
    return false;
  }
};

// Test 3: Check if MoveInIssue model exists
const testMoveInIssueModel = async () => {
  console.log('\n🧪 TEST 3: Check MoveInIssue model');
  
  try {
    // Try to count move-in issues
    const issueCount = await prisma.moveInIssue.count();
    console.log(`✅ MoveInIssue model exists, count: ${issueCount}`);
    
    // Try to create a simple move-in issue
    const testIssue = await prisma.moveInIssue.create({
      data: {
        title: 'Test Issue',
        description: 'Test description',
        priority: 'HIGH',
        category: 'SAFETY',
        status: 'OPEN',
        reportedBy: testData.users.tenant.id
      }
    });
    
    console.log(`✅ Created test move-in issue: ${testIssue.id}`);
    
    // Clean up the test issue
    await prisma.moveInIssue.delete({
      where: { id: testIssue.id }
    });
    
    console.log(`✅ Test move-in issue cleaned up`);
    return true;
  } catch (error) {
    console.error('❌ MoveInIssue model test failed:', error.message);
    return false;
  }
};

// Test 4: Test MoveInIssueComment model
const testMoveInIssueCommentModel = async () => {
  console.log('\n🧪 TEST 4: Check MoveInIssueComment model');
  
  try {
    // Try to count move-in issue comments
    const commentCount = await prisma.moveInIssueComment.count();
    console.log(`✅ MoveInIssueComment model exists, count: ${commentCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ MoveInIssueComment model test failed:', error.message);
    return false;
  }
};

// Test 5: Test MoveInIssueAdminDecision model
const testMoveInIssueAdminDecisionModel = async () => {
  console.log('\n🧪 TEST 5: Check MoveInIssueAdminDecision model');
  
  try {
    // Try to count move-in issue admin decisions
    const decisionCount = await prisma.moveInIssueAdminDecision.count();
    console.log(`✅ MoveInIssueAdminDecision model exists, count: ${decisionCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ MoveInIssueAdminDecision model test failed:', error.message);
    return false;
  }
};

// Cleanup function
const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
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
const runBasicTest = async () => {
  console.log('🚀 Starting Basic Move-In Issue Test');
  console.log('=====================================');
  
  try {
    // Run tests
    const results = [];
    results.push(await testCreateUsers());
    results.push(await testDatabaseConnectivity());
    results.push(await testMoveInIssueModel());
    results.push(await testMoveInIssueCommentModel());
    results.push(await testMoveInIssueAdminDecisionModel());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Move-in issue models are working correctly.');
      console.log('✅ The move-in issue system is ready for end-to-end testing.');
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
runBasicTest();
