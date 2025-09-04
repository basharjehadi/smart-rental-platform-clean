#!/usr/bin/env node

/**
 * End-to-End Automated Test for Move-In Issue Flow
 * 
 * This test covers the complete move-in issue lifecycle:
 * 1. Tenant creates a move-in issue
 * 2. Tenant views the issue
 * 3. Landlord responds to the issue
 * 4. Admin reviews and approves the issue
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

// Test data
const testData = {
  tenant: {
    email: 'tenant@test.com',
    password: 'password123',
    name: 'Test Tenant',
    role: 'TENANT'
  },
  landlord: {
    email: 'landlord@test.com', 
    password: 'password123',
    name: 'Test Landlord',
    role: 'LANDLORD'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123', 
    name: 'Test Admin',
    role: 'ADMIN'
  }
};

let authTokens = {};
let testIssueId = null;
let testOfferId = null;

// Helper function to make authenticated API calls
const apiCall = async (method, url, data = null, token = null) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const responseData = await response.json();
    
    if (response.ok) {
      return { success: true, data: responseData, status: response.status };
    } else {
      return { 
        success: false, 
        error: responseData,
        status: response.status 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: 0
    };
  }
};

// Helper function to login and get token
const login = async (email, password) => {
  console.log(`🔐 Logging in ${email}...`);
  const result = await apiCall('POST', '/auth/login', { email, password });
  
  if (result.success && result.data.token) {
    authTokens[email] = result.data.token;
    console.log(`✅ ${email} logged in successfully`);
    return result.data.token;
  } else {
    console.error(`❌ Login failed for ${email}:`, result.error);
    throw new Error(`Login failed for ${email}`);
  }
};

// Helper function to create test users
const createTestUsers = async () => {
  console.log('👥 Creating test users...');
  
  for (const [role, userData] of Object.entries(testData)) {
    try {
      // Try to create user
      const createResult = await apiCall('POST', '/auth/register', {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role
      });
      
      if (createResult.success) {
        console.log(`✅ Created ${role} user: ${userData.email}`);
      } else if (createResult.error?.message?.includes('already exists')) {
        console.log(`ℹ️  ${role} user already exists: ${userData.email}`);
      } else {
        console.error(`❌ Failed to create ${role} user:`, createResult.error);
      }
    } catch (error) {
      console.error(`❌ Error creating ${role} user:`, error.message);
    }
  }
};

// Helper function to create test property and offer
const createTestPropertyAndOffer = async () => {
  console.log('🏠 Creating test property and offer...');
  
  const landlordToken = authTokens[testData.landlord.email];
  
  // Create a test property
  const propertyData = {
    name: 'Test Property for Move-In Issue',
    description: 'A test property for automated testing',
    address: '123 Test Street, Test City',
    price: 1000,
    bedrooms: 2,
    bathrooms: 1,
    area: 1000,
    propertyType: 'APARTMENT',
    furnished: true,
    availableFrom: new Date().toISOString(),
    availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  const propertyResult = await apiCall('POST', '/properties', propertyData, landlordToken);
  
  if (!propertyResult.success) {
    console.error('❌ Failed to create test property:', propertyResult.error);
    throw new Error('Failed to create test property');
  }
  
  const propertyId = propertyResult.data.property.id;
  console.log(`✅ Created test property: ${propertyId}`);
  
  // Create a rental request
  const tenantToken = authTokens[testData.tenant.email];
  const requestData = {
    propertyId,
    moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 12,
    message: 'Test rental request for move-in issue testing'
  };
  
  const requestResult = await apiCall('POST', '/rental-requests', requestData, tenantToken);
  
  if (!requestResult.success) {
    console.error('❌ Failed to create rental request:', requestResult.error);
    throw new Error('Failed to create rental request');
  }
  
  const requestId = requestResult.data.request.id;
  console.log(`✅ Created rental request: ${requestId}`);
  
  // Create an offer
  const offerData = {
    rentalRequestId: requestId,
    message: 'Test offer for move-in issue testing',
    leaseStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    leaseEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyRent: 1000
  };
  
  const offerResult = await apiCall('POST', '/offers', offerData, landlordToken);
  
  if (!offerResult.success) {
    console.error('❌ Failed to create offer:', offerResult.error);
    throw new Error('Failed to create offer');
  }
  
  testOfferId = offerResult.data.offer.id;
  console.log(`✅ Created test offer: ${testOfferId}`);
  
  // Simulate payment (mock payment)
  const paymentResult = await apiCall('POST', '/payments/mock', {
    offerId: testOfferId,
    amount: 1000
  }, tenantToken);
  
  if (!paymentResult.success) {
    console.error('❌ Failed to process mock payment:', paymentResult.error);
    throw new Error('Failed to process mock payment');
  }
  
  console.log(`✅ Mock payment processed for offer: ${testOfferId}`);
  
  return { propertyId, requestId, offerId: testOfferId };
};

// Test 1: Tenant creates move-in issue
const testTenantCreatesIssue = async () => {
  console.log('\n🧪 TEST 1: Tenant creates move-in issue');
  
  const tenantToken = authTokens[testData.tenant.email];
  
  const issueData = {
    offerId: testOfferId,
    title: 'Test Move-In Issue - Broken Door',
    description: 'The front door is broken and needs repair before move-in',
    priority: 'HIGH',
    category: 'SAFETY'
  };
  
  const result = await apiCall('POST', '/move-in-issues', issueData, tenantToken);
  
  if (result.success) {
    testIssueId = result.data.issue.id;
    console.log(`✅ Tenant created move-in issue: ${testIssueId}`);
    console.log(`   Title: ${result.data.issue.title}`);
    console.log(`   Status: ${result.data.issue.status}`);
    return true;
  } else {
    console.error('❌ Failed to create move-in issue:', result.error);
    return false;
  }
};

// Test 2: Tenant views the issue
const testTenantViewsIssue = async () => {
  console.log('\n🧪 TEST 2: Tenant views the issue');
  
  const tenantToken = authTokens[testData.tenant.email];
  
  const result = await apiCall('GET', `/move-in-issues/${testIssueId}`, null, tenantToken);
  
  if (result.success) {
    console.log(`✅ Tenant successfully viewed issue: ${testIssueId}`);
    console.log(`   Title: ${result.data.issue.title}`);
    console.log(`   Description: ${result.data.issue.description}`);
    console.log(`   Status: ${result.data.issue.status}`);
    console.log(`   Comments: ${result.data.issue.comments?.length || 0}`);
    return true;
  } else {
    console.error('❌ Failed to view issue:', result.error);
    return false;
  }
};

// Test 3: Landlord responds to the issue
const testLandlordResponds = async () => {
  console.log('\n🧪 TEST 3: Landlord responds to the issue');
  
  const landlordToken = authTokens[testData.landlord.email];
  
  // Landlord adds a comment
  const commentData = {
    content: 'I will arrange for the door repair immediately. A contractor will be there tomorrow morning.'
  };
  
  const commentResult = await apiCall('POST', `/move-in-issues/${testIssueId}/comments`, commentData, landlordToken);
  
  if (!commentResult.success) {
    console.error('❌ Failed to add landlord comment:', commentResult.error);
    return false;
  }
  
  console.log(`✅ Landlord added comment: ${commentResult.data.comment.id}`);
  
  // Landlord updates issue status
  const statusData = {
    status: 'IN_PROGRESS'
  };
  
  const statusResult = await apiCall('PUT', `/move-in-issues/${testIssueId}/status`, statusData, landlordToken);
  
  if (statusResult.success) {
    console.log(`✅ Landlord updated issue status to: ${statusData.status}`);
    return true;
  } else {
    console.error('❌ Failed to update issue status:', statusResult.error);
    return false;
  }
};

// Test 4: Admin reviews and approves the issue
const testAdminReviewsAndApproves = async () => {
  console.log('\n🧪 TEST 4: Admin reviews and approves the issue');
  
  const adminToken = authTokens[testData.admin.email];
  
  // Admin adds a comment
  const commentData = {
    content: 'Issue reviewed. Door repair has been completed and verified. Issue can be marked as resolved.'
  };
  
  const commentResult = await apiCall('POST', `/move-in-issues/${testIssueId}/comments`, commentData, adminToken);
  
  if (!commentResult.success) {
    console.error('❌ Failed to add admin comment:', commentResult.error);
    return false;
  }
  
  console.log(`✅ Admin added comment: ${commentResult.data.comment.id}`);
  
  // Admin makes a decision
  const decisionData = {
    decision: 'APPROVED',
    reasoning: 'Door repair completed successfully. Property is safe for move-in.',
    resolution: 'Issue resolved - door repaired and tested'
  };
  
  const decisionResult = await apiCall('POST', `/move-in-issues/${testIssueId}/admin-decision`, decisionData, adminToken);
  
  if (decisionResult.success) {
    console.log(`✅ Admin made decision: ${decisionData.decision}`);
    console.log(`   Reasoning: ${decisionData.reasoning}`);
    return true;
  } else {
    console.error('❌ Failed to make admin decision:', decisionResult.error);
    return false;
  }
};

// Test 5: Verify final issue state
const testVerifyFinalState = async () => {
  console.log('\n🧪 TEST 5: Verify final issue state');
  
  const tenantToken = authTokens[testData.tenant.email];
  
  const result = await apiCall('GET', `/move-in-issues/${testIssueId}`, null, tenantToken);
  
  if (result.success) {
    const issue = result.data.issue;
    console.log(`✅ Final issue state verified:`);
    console.log(`   Status: ${issue.status}`);
    console.log(`   Admin Decision: ${issue.adminDecision?.decision || 'None'}`);
    console.log(`   Total Comments: ${issue.comments?.length || 0}`);
    console.log(`   Created: ${issue.createdAt}`);
    console.log(`   Updated: ${issue.updatedAt}`);
    
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
    console.error('❌ Failed to verify final state:', result.error);
    return false;
  }
};

// Cleanup function
const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    if (testIssueId) {
      await prisma.moveInIssue.delete({ where: { id: testIssueId } });
      console.log(`✅ Deleted test issue: ${testIssueId}`);
    }
    
    if (testOfferId) {
      await prisma.offer.delete({ where: { id: testOfferId } });
      console.log(`✅ Deleted test offer: ${testOfferId}`);
    }
    
    // Clean up test users
    for (const [role, userData] of Object.entries(testData)) {
      await prisma.user.deleteMany({ where: { email: userData.email } });
      console.log(`✅ Deleted test user: ${userData.email}`);
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
};

// Main test runner
const runE2ETest = async () => {
  console.log('🚀 Starting End-to-End Move-In Issue Test');
  console.log('==========================================');
  
  try {
    // Setup
    await createTestUsers();
    
    // Login all users
    await login(testData.tenant.email, testData.tenant.password);
    await login(testData.landlord.email, testData.landlord.password);
    await login(testData.admin.email, testData.admin.password);
    
    // Create test data
    await createTestPropertyAndOffer();
    
    // Run tests
    const results = [];
    results.push(await testTenantCreatesIssue());
    results.push(await testTenantViewsIssue());
    results.push(await testLandlordResponds());
    results.push(await testAdminReviewsAndApproves());
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
