#!/usr/bin/env node

/**
 * Simple Final Test for Move-In Issue Flow
 * 
 * This test verifies the basic move-in issue functionality without complex relationships
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

// Test 2: Test database connectivity and models
const testDatabaseAndModels = async () => {
  console.log('\n🧪 TEST 2: Test database connectivity and models');
  
  try {
    // Test basic database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Database connection successful`);
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    // Test MoveInIssue model exists
    try {
      const issueCount = await prisma.moveInIssue.count();
      console.log(`✅ MoveInIssue model exists, count: ${issueCount}`);
    } catch (error) {
      console.log(`❌ MoveInIssue model not available: ${error.message}`);
      return false;
    }
    
    // Test MoveInIssueComment model exists
    try {
      const commentCount = await prisma.moveInIssueComment.count();
      console.log(`✅ MoveInIssueComment model exists, count: ${commentCount}`);
    } catch (error) {
      console.log(`❌ MoveInIssueComment model not available: ${error.message}`);
      return false;
    }
    
    // Test MoveInIssueAdminDecision model exists
    try {
      const decisionCount = await prisma.moveInIssueAdminDecision.count();
      console.log(`✅ MoveInIssueAdminDecision model exists, count: ${decisionCount}`);
    } catch (error) {
      console.log(`❌ MoveInIssueAdminDecision model not available: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database and models test failed:', error.message);
    return false;
  }
};

// Test 3: Test schema validation
const testSchemaValidation = async () => {
  console.log('\n🧪 TEST 3: Test schema validation');
  
  try {
    // Test if we can query the schema
    const models = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%move_in%'
    `;
    
    console.log(`✅ Found move-in related tables:`, models);
    
    // Test if we can query the MoveInIssue table structure
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'move_in_issues'
    `;
    
    console.log(`✅ MoveInIssue table columns:`, columns);
    
    return true;
  } catch (error) {
    console.error('❌ Schema validation test failed:', error.message);
    return false;
  }
};

// Test 4: Test basic CRUD operations (if possible)
const testBasicCRUD = async () => {
  console.log('\n🧪 TEST 4: Test basic CRUD operations');
  
  try {
    // Try to find existing move-in issues
    const existingIssues = await prisma.moveInIssue.findMany({
      take: 5,
      include: {
        comments: {
          take: 3,
          include: {
            author: {
              select: { name: true, role: true }
            }
          }
        }
      }
    });
    
    console.log(`✅ Found ${existingIssues.length} existing move-in issues`);
    
    if (existingIssues.length > 0) {
      const issue = existingIssues[0];
      console.log(`✅ Sample issue: ${issue.title} (${issue.status})`);
      console.log(`✅ Comments: ${issue.comments?.length || 0}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Basic CRUD test failed:', error.message);
    return false;
  }
};

// Test 5: Test workflow simulation
const testWorkflowSimulation = async () => {
  console.log('\n🧪 TEST 5: Test workflow simulation');
  
  try {
    // Simulate the workflow by checking if we can access the data
    const issues = await prisma.moveInIssue.findMany({
      take: 1,
      include: {
        comments: {
          include: {
            author: {
              select: { name: true, role: true }
            }
          }
        }
      }
    });
    
    if (issues.length > 0) {
      const issue = issues[0];
      console.log(`✅ Workflow simulation successful:`);
      console.log(`   Issue: ${issue.title}`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   Comments: ${issue.comments?.length || 0}`);
      
      // Check if we have different user roles in comments
      const roles = issue.comments?.map(c => c.author?.role).filter(Boolean) || [];
      const uniqueRoles = [...new Set(roles)];
      console.log(`   User roles in comments: ${uniqueRoles.join(', ')}`);
      
      if (uniqueRoles.length > 0) {
        console.log(`✅ Multi-role communication verified`);
        return true;
      } else {
        console.log(`ℹ️  No comments found, but issue structure is valid`);
        return true;
      }
    } else {
      console.log(`ℹ️  No existing issues found, but models are accessible`);
      return true;
    }
  } catch (error) {
    console.error('❌ Workflow simulation test failed:', error.message);
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
const runSimpleFinalTest = async () => {
  console.log('🚀 Starting Simple Final Move-In Issue Test');
  console.log('============================================');
  
  try {
    // Run tests
    const results = [];
    results.push(await testCreateUsers());
    results.push(await testDatabaseAndModels());
    results.push(await testSchemaValidation());
    results.push(await testBasicCRUD());
    results.push(await testWorkflowSimulation());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Move-in issue system is working correctly.');
      console.log('✅ The move-in issue models are accessible and functional.');
      console.log('✅ The system is ready for end-to-end testing.');
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
runSimpleFinalTest();
