/**
 * End-to-End Automated Test for Lease Lifecycle and Renewal Process
 * 
 * This test covers the complete workflow:
 * 1. User authentication (tenant and landlord)
 * 2. Lease creation and management
 * 3. Renewal request workflow
 * 4. State machine transitions
 * 5. Real-time notifications
 * 6. Auto-expiration
 * 7. Business logic validation
 */

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  tenantEmail: 'tenant@test.com',
  landlordEmail: 'landlord@test.com',
  adminEmail: 'admin@test.com',
  testPropertyId: null,
  testLeaseId: null,
  testRenewalId: null,
  tenantToken: null,
  landlordToken: null,
  adminToken: null
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data, success: response.ok };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'ERROR');
    return { response: null, data: null, success: false, error };
  }
};

const assert = (condition, message) => {
  if (condition) {
    testResults.passed++;
    log(`PASS: ${message}`, 'SUCCESS');
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    log(`FAIL: ${message}`, 'ERROR');
  }
};

// Test functions
const testAuthentication = async () => {
  log('🔐 Testing Authentication...');
  
  // Test tenant login
  const tenantLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_CONFIG.tenantEmail,
      password: 'password123'
    })
  });
  
  assert(tenantLogin.success, 'Tenant login should succeed');
  if (tenantLogin.success) {
    TEST_CONFIG.tenantToken = tenantLogin.data.token;
  }
  
  // Test landlord login
  const landlordLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_CONFIG.landlordEmail,
      password: 'password123'
    })
  });
  
  assert(landlordLogin.success, 'Landlord login should succeed');
  if (landlordLogin.success) {
    TEST_CONFIG.landlordToken = landlordLogin.data.token;
  }
  
  // Test admin login
  const adminLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_CONFIG.adminEmail,
      password: 'password123'
    })
  });
  
  assert(adminLogin.success, 'Admin login should succeed');
  if (adminLogin.success) {
    TEST_CONFIG.adminToken = adminLogin.data.token;
  }
};

const testLeaseCreation = async () => {
  log('🏠 Testing Lease Creation...');
  
  // First, create a property for the landlord
  const propertyResponse = await makeRequest('/properties', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.landlordToken}`
    },
    body: JSON.stringify({
      title: 'Test Property for Renewal',
      description: 'A test property for renewal testing',
      address: '123 Test Street, Test City',
      city: 'Test City',
      propertyType: 'APARTMENT',
      bedrooms: 2,
      bathrooms: 1,
      monthlyRent: 1000,
      depositAmount: 1000,
      availableFrom: new Date().toISOString(),
      amenities: ['Parking', 'Balcony'],
      rules: 'No pets allowed'
    })
  });
  
  assert(propertyResponse.success, 'Property creation should succeed');
  if (propertyResponse.success) {
    TEST_CONFIG.testPropertyId = propertyResponse.data.property.id;
  }
  
  // Create a rental request
  const rentalRequestResponse = await makeRequest('/rental-request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    },
    body: JSON.stringify({
      title: 'Test Rental Request',
      description: 'Looking for a 2-bedroom apartment',
      location: 'Test City',
      moveInDate: new Date().toISOString(),
      budget: 1200,
      bedrooms: 2,
      bathrooms: 1,
      furnished: false,
      parking: true,
      petsAllowed: false
    })
  });
  
  assert(rentalRequestResponse.success, 'Rental request creation should succeed');
  
  // Create an offer
  const offerResponse = await makeRequest('/offers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.landlordToken}`
    },
    body: JSON.stringify({
      rentalRequestId: rentalRequestResponse.data.rentalRequest.id,
      propertyId: TEST_CONFIG.testPropertyId,
      rentAmount: 1000,
      depositAmount: 1000,
      leaseDuration: 12,
      description: 'Great apartment for rent',
      availableFrom: new Date().toISOString()
    })
  });
  
  assert(offerResponse.success, 'Offer creation should succeed');
  
  // Accept the offer (simulate payment)
  const acceptOfferResponse = await makeRequest(`/offers/${offerResponse.data.offer.id}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(acceptOfferResponse.success, 'Offer acceptance should succeed');
  
  // Create a lease (this would normally be done by the system)
  const lease = await prisma.lease.create({
    data: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      rentAmount: 1000,
      depositAmount: 1000,
      status: 'ACTIVE',
      tenantGroupId: 'test-tenant-group-id',
      unitId: 'test-unit-id',
      rentalRequestId: rentalRequestResponse.data.rentalRequest.id,
      offerId: offerResponse.data.offer.id,
      propertyId: TEST_CONFIG.testPropertyId
    }
  });
  
  TEST_CONFIG.testLeaseId = lease.id;
  log(`Created test lease: ${lease.id}`);
};

const testRenewalWorkflow = async () => {
  log('🔄 Testing Renewal Workflow...');
  
  // Test 1: Tenant sends renewal request (should only allow note)
  const tenantRenewalRequest = await makeRequest(`/leases/${TEST_CONFIG.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    },
    body: JSON.stringify({
      note: 'I would like to renew my lease for another year',
      proposedTermMonths: 12, // This should be ignored
      proposedMonthlyRent: 1100 // This should be ignored
    })
  });
  
  assert(tenantRenewalRequest.success, 'Tenant renewal request should succeed');
  if (tenantRenewalRequest.success) {
    TEST_CONFIG.testRenewalId = tenantRenewalRequest.data.renewal.id;
  }
  
  // Test 2: Check that tenant cannot set terms/rent
  const tenantWithTermsRequest = await makeRequest(`/leases/${TEST_CONFIG.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    },
    body: JSON.stringify({
      note: 'I want to renew',
      proposedTermMonths: 12,
      proposedMonthlyRent: 1100
    })
  });
  
  assert(!tenantWithTermsRequest.success, 'Tenant should not be able to set terms/rent');
  assert(tenantWithTermsRequest.data?.error?.includes('cannot propose renewal terms'), 
    'Should return appropriate error message');
  
  // Test 3: Landlord proposes renewal terms
  const landlordProposal = await makeRequest(`/leases/${TEST_CONFIG.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.landlordToken}`
    },
    body: JSON.stringify({
      proposedTermMonths: 12,
      proposedMonthlyRent: 1100,
      proposedStartDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      note: 'Happy to renew with a 10% rent increase'
    })
  });
  
  assert(landlordProposal.success, 'Landlord proposal should succeed');
  
  // Test 4: Check workflow state
  const workflowState = await makeRequest(`/leases/${TEST_CONFIG.testLeaseId}/renewal-workflow`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(workflowState.success, 'Workflow state should be retrievable');
  if (workflowState.success) {
    const workflow = workflowState.data.workflow;
    assert(workflow.hasActiveRenewal, 'Should have active renewal');
    assert(workflow.canAcceptRenewal, 'Tenant should be able to accept renewal');
    assert(!workflow.canRequestRenewal, 'Tenant should not be able to request new renewal');
  }
  
  // Test 5: Tenant accepts renewal
  const acceptRenewal = await makeRequest(`/renewals/${TEST_CONFIG.testRenewalId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(acceptRenewal.success, 'Tenant should be able to accept renewal');
  
  // Test 6: Verify new lease was created
  const newLeases = await prisma.lease.findMany({
    where: {
      propertyId: TEST_CONFIG.testPropertyId
    },
    orderBy: { createdAt: 'desc' }
  });
  
  assert(newLeases.length >= 2, 'Should have at least 2 leases (original + renewal)');
  if (newLeases.length >= 2) {
    const newLease = newLeases[0];
    assert(newLease.rentAmount === 1100, 'New lease should have updated rent amount');
  }
};

const testRenewalStateMachine = async () => {
  log('🔄 Testing Renewal State Machine...');
  
  // Create a new lease for state machine testing
  const testLease = await prisma.lease.create({
    data: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      rentAmount: 1000,
      depositAmount: 1000,
      status: 'ACTIVE',
      tenantGroupId: 'test-tenant-group-2',
      unitId: 'test-unit-2',
      propertyId: TEST_CONFIG.testPropertyId
    }
  });
  
  // Test 1: Initial state - no active renewal
  const initialState = await makeRequest(`/leases/${testLease.id}/renewal-workflow`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(initialState.success, 'Should get initial workflow state');
  if (initialState.success) {
    const workflow = initialState.data.workflow;
    assert(!workflow.hasActiveRenewal, 'Should not have active renewal initially');
    assert(workflow.canRequestRenewal, 'Tenant should be able to request renewal');
  }
  
  // Test 2: Tenant requests renewal
  const tenantRequest = await makeRequest(`/leases/${testLease.id}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    },
    body: JSON.stringify({
      note: 'I want to renew my lease'
    })
  });
  
  assert(tenantRequest.success, 'Tenant renewal request should succeed');
  const renewalId = tenantRequest.data.renewal.id;
  
  // Test 3: Check PENDING state
  const pendingState = await makeRequest(`/leases/${testLease.id}/renewal-workflow`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.landlordToken}`
    }
  });
  
  assert(pendingState.success, 'Should get pending workflow state');
  if (pendingState.success) {
    const workflow = pendingState.data.workflow;
    assert(workflow.hasActiveRenewal, 'Should have active renewal');
    assert(workflow.currentStatus === 'PENDING', 'Status should be PENDING');
    assert(workflow.canProposeRenewal, 'Landlord should be able to propose renewal');
  }
  
  // Test 4: Landlord counters with proposal
  const landlordCounter = await makeRequest(`/renewals/${renewalId}/counter`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.landlordToken}`
    },
    body: JSON.stringify({
      proposedTermMonths: 12,
      proposedMonthlyRent: 1100,
      note: 'Here are my proposed terms'
    })
  });
  
  assert(landlordCounter.success, 'Landlord counter should succeed');
  
  // Test 5: Check COUNTERED state
  const counteredState = await makeRequest(`/leases/${testLease.id}/renewal-workflow`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(counteredState.success, 'Should get countered workflow state');
  if (counteredState.success) {
    const workflow = counteredState.data.workflow;
    assert(workflow.currentStatus === 'COUNTERED', 'Status should be COUNTERED');
    assert(workflow.canAcceptRenewal, 'Tenant should be able to accept renewal');
  }
  
  // Test 6: Tenant accepts renewal
  const acceptRenewal = await makeRequest(`/renewals/${renewalId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(acceptRenewal.success, 'Tenant should be able to accept renewal');
  
  // Test 7: Check ACCEPTED state
  const acceptedState = await makeRequest(`/leases/${testLease.id}/renewal-workflow`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(acceptedState.success, 'Should get accepted workflow state');
  if (acceptedState.success) {
    const workflow = acceptedState.data.workflow;
    assert(!workflow.hasActiveRenewal, 'Should not have active renewal after acceptance');
  }
};

const testRenewalExpiration = async () => {
  log('⏰ Testing Renewal Expiration...');
  
  // Create a lease with an expired renewal
  const testLease = await prisma.lease.create({
    data: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      rentAmount: 1000,
      depositAmount: 1000,
      status: 'ACTIVE',
      tenantGroupId: 'test-tenant-group-3',
      unitId: 'test-unit-3',
      propertyId: TEST_CONFIG.testPropertyId
    }
  });
  
  // Create an expired renewal request
  const expiredRenewal = await prisma.renewalRequest.create({
    data: {
      leaseId: testLease.id,
      initiatorUserId: 'test-tenant-id',
      status: 'PENDING',
      note: 'This renewal will expire',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired 1 day ago
    }
  });
  
  // Test auto-expiration
  const expireResponse = await makeRequest('/renewals/expire-old', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
    }
  });
  
  assert(expireResponse.success, 'Auto-expiration should succeed');
  if (expireResponse.success) {
    assert(expireResponse.data.expiredCount > 0, 'Should have expired some renewals');
  }
  
  // Verify the renewal was marked as expired
  const expiredRenewalCheck = await prisma.renewalRequest.findUnique({
    where: { id: expiredRenewal.id }
  });
  
  assert(expiredRenewalCheck?.status === 'EXPIRED', 'Renewal should be marked as expired');
};

const testSecurityAndPermissions = async () => {
  log('🛡️ Testing Security and Permissions...');
  
  // Test 1: Unauthorized access
  const unauthorizedAccess = await makeRequest(`/leases/${TEST_CONFIG.testLeaseId}/renewals`, {
    method: 'POST',
    body: JSON.stringify({
      note: 'Unauthorized request'
    })
  });
  
  assert(!unauthorizedAccess.success, 'Unauthorized access should fail');
  
  // Test 2: Cross-tenant access (tenant trying to access another tenant's lease)
  const crossTenantAccess = await makeRequest(`/leases/${TEST_CONFIG.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    },
    body: JSON.stringify({
      note: 'Cross-tenant request'
    })
  });
  
  // This should succeed because it's the same tenant, but let's test with a different approach
  // Create a new tenant and try to access the original lease
  const newTenantResponse = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'New Tenant',
      email: 'newtenant@test.com',
      password: 'password123',
      role: 'TENANT'
    })
  });
  
  if (newTenantResponse.success) {
    const newTenantToken = newTenantResponse.data.token;
    
    const crossAccess = await makeRequest(`/leases/${TEST_CONFIG.testLeaseId}/renewals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${newTenantToken}`
      },
      body: JSON.stringify({
        note: 'Cross-tenant request'
      })
    });
    
    assert(!crossAccess.success, 'Cross-tenant access should fail');
  }
  
  // Test 3: Landlord trying to accept their own proposal
  const landlordSelfAccept = await makeRequest(`/renewals/${TEST_CONFIG.testRenewalId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.landlordToken}`
    }
  });
  
  assert(!landlordSelfAccept.success, 'Landlord should not be able to accept their own proposal');
};

const testNotifications = async () => {
  log('🔔 Testing Notifications...');
  
  // Create a new lease for notification testing
  const testLease = await prisma.lease.create({
    data: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      rentAmount: 1000,
      depositAmount: 1000,
      status: 'ACTIVE',
      tenantGroupId: 'test-tenant-group-4',
      unitId: 'test-unit-4',
      propertyId: TEST_CONFIG.testPropertyId
    }
  });
  
  // Test 1: Tenant sends renewal request (should notify landlord)
  const tenantRequest = await makeRequest(`/leases/${testLease.id}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    },
    body: JSON.stringify({
      note: 'I want to renew my lease'
    })
  });
  
  assert(tenantRequest.success, 'Tenant renewal request should succeed');
  
  // Check if notification was created
  const notifications = await prisma.notification.findMany({
    where: {
      type: 'SYSTEM_ANNOUNCEMENT',
      title: { contains: 'Renewal' }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  assert(notifications.length > 0, 'Should have created renewal notifications');
  
  // Test 2: Landlord proposes terms (should notify tenant)
  const renewalId = tenantRequest.data.renewal.id;
  const landlordProposal = await makeRequest(`/renewals/${renewalId}/counter`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.landlordToken}`
    },
    body: JSON.stringify({
      proposedTermMonths: 12,
      proposedMonthlyRent: 1100,
      note: 'Here are my proposed terms'
    })
  });
  
  assert(landlordProposal.success, 'Landlord proposal should succeed');
  
  // Test 3: Tenant accepts (should notify landlord)
  const acceptRenewal = await makeRequest(`/renewals/${renewalId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.tenantToken}`
    }
  });
  
  assert(acceptRenewal.success, 'Tenant acceptance should succeed');
};

const cleanup = async () => {
  log('🧹 Cleaning up test data...');
  
  try {
    // Clean up test data
    await prisma.renewalRequest.deleteMany({
      where: {
        leaseId: { in: [TEST_CONFIG.testLeaseId] }
      }
    });
    
    await prisma.lease.deleteMany({
      where: {
        propertyId: TEST_CONFIG.testPropertyId
      }
    });
    
    await prisma.property.deleteMany({
      where: {
        id: TEST_CONFIG.testPropertyId
      }
    });
    
    await prisma.notification.deleteMany({
      where: {
        type: 'SYSTEM_ANNOUNCEMENT',
        title: { contains: 'Renewal' }
      }
    });
    
    log('Cleanup completed successfully');
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'ERROR');
  }
};

const printTestResults = () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! The lease lifecycle and renewal system is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('='.repeat(60) + '\n');
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting End-to-End Lease Lifecycle and Renewal Tests...\n');
  
  try {
    await testAuthentication();
    await testLeaseCreation();
    await testRenewalWorkflow();
    await testRenewalStateMachine();
    await testRenewalExpiration();
    await testSecurityAndPermissions();
    await testNotifications();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'ERROR');
    testResults.failed++;
    testResults.errors.push(`Test execution error: ${error.message}`);
  } finally {
    await cleanup();
    printTestResults();
    await prisma.$disconnect();
  }
};

// Run the tests
runTests().catch(console.error);


