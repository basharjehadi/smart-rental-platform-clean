/**
 * 🏠 Termination Policy Test Suite
 * 
 * Tests the new termination policy implementation as outlined by ChatGPT
 * 
 * Run with: node test-termination-policy.js
 */

const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  tenantToken: null,
  landlordToken: null,
  adminToken: null,
  testLeaseId: null,
  testTerminationId: null,
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function for making requests
const makeRequest = async (endpoint, options = {}) => {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Assertion helper
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

// Logging helper
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const icon = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : 'ℹ️';
  console.log(`${icon} [${timestamp}] ${message}`);
};

// Test functions
const testAuthentication = async () => {
  log('🔐 Testing Authentication...');
  
  // Test tenant login
  const tenantLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'tenant@test.com',
      password: 'password123'
    })
  });
  
  assert(tenantLogin.success, 'Tenant login should succeed');
  testConfig.tenantToken = tenantLogin.data.token;
  
  // Test landlord login
  const landlordLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'landlord@test.com',
      password: 'password123'
    })
  });
  
  assert(landlordLogin.success, 'Landlord login should succeed');
  testConfig.landlordToken = landlordLogin.data.token;
  
  // Test admin login
  const adminLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'password123'
    })
  });
  
  assert(adminLogin.success, 'Admin login should succeed');
  testConfig.adminToken = adminLogin.data.token;
  
  log('Authentication successful!', 'SUCCESS');
};

const createTestLease = async () => {
  log('🏠 Creating test lease...');
  
  // First, create a rental request
  const rentalRequest = await makeRequest('/rental-request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      title: 'Test Rental Request for Termination Policy',
      description: 'Testing termination policy implementation',
      location: 'Warsaw, Poland',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      budget: 3000,
      propertyType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1
    })
  });
  
  log(`Rental request response: ${JSON.stringify(rentalRequest)}`);
  assert(rentalRequest.success, `Rental request creation should succeed. Response: ${JSON.stringify(rentalRequest)}`);
  const requestId = rentalRequest.data.rentalRequest.id;
  
  // Create a property
  const property = await makeRequest('/properties', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    },
    body: JSON.stringify({
      name: 'Test Property for Termination',
      address: 'Test Street 123, Warsaw',
      city: 'Warsaw',
      zipCode: '00-001',
      propertyType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      size: 65,
      rentAmount: 3000,
      depositAmount: 3000,
      description: 'Test property for termination policy testing'
    })
  });
  
  assert(property.success, 'Property creation should succeed');
  const propertyId = property.data.property.id;
  
  // Create an offer
  const offer = await makeRequest(`/rental-requests/${requestId}/offers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    },
    body: JSON.stringify({
      propertyId: propertyId,
      rentAmount: 3000,
      depositAmount: 3000,
      leaseDuration: 12,
      description: 'Test offer for termination policy',
      availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
  
  assert(offer.success, 'Offer creation should succeed');
  const offerId = offer.data.offer.id;
  
  // Accept the offer
  const acceptOffer = await makeRequest(`/offers/${offerId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(acceptOffer.success, 'Offer acceptance should succeed');
  
  // Make payment
  const payment = await makeRequest('/payments/mock-payment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      offerId: offerId,
      amount: 6000, // rent + deposit
      purpose: 'DEPOSIT_AND_FIRST_MONTH'
    })
  });
  
  assert(payment.success, 'Payment should succeed');
  
  // Get the lease ID from the offer
  const offerDetails = await makeRequest(`/offers/${offerId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  if (offerDetails.success && offerDetails.data.offer.lease) {
    testConfig.testLeaseId = offerDetails.data.offer.lease.id;
    log(`Test lease created with ID: ${testConfig.testLeaseId}`, 'SUCCESS');
  } else {
    // Try to find lease through rental request
    const requestDetails = await makeRequest(`/rental-requests/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testConfig.tenantToken}`
      }
    });
    
    if (requestDetails.success && requestDetails.data.rentalRequest.leases?.[0]) {
      testConfig.testLeaseId = requestDetails.data.rentalRequest.leases[0].id;
      log(`Test lease found with ID: ${testConfig.testLeaseId}`, 'SUCCESS');
    } else {
      throw new Error('Could not create or find test lease');
    }
  }
};

const testTerminationPolicyPreview = async () => {
  log('📋 Testing Termination Policy Preview...');
  
  if (!testConfig.testLeaseId) {
    log('Skipping termination policy preview test - no lease available', 'ERROR');
    return;
  }
  
  // Test 1: Get termination policy preview
  const policyPreview = await makeRequest(`/leases/${testConfig.testLeaseId}/termination-policy`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(policyPreview.success, 'Termination policy preview should be accessible');
  
  const policy = policyPreview.data.terminationPolicyPreview;
  assert(policy.cutoffDay === 10, 'Cutoff day should be 10');
  assert(policy.minNoticeDays === 30, 'Minimum notice days should be 30');
  assert(policy.timezone === 'Europe/Warsaw', 'Timezone should be Europe/Warsaw');
  assert(policy.earliestEnd, 'Should have earliest end date');
  assert(policy.explanation, 'Should have policy explanation');
  
  // Test explanation content
  const explanation = policy.explanation;
  assert(explanation.includes('day 10'), 'Explanation should mention day 10');
  assert(explanation.includes('next month'), 'Explanation should mention next month');
  assert(explanation.includes('month after next'), 'Explanation should mention month after next');
  assert(explanation.includes('30 days'), 'Explanation should mention 30 days minimum notice');
  
  log('Termination policy preview test passed!', 'SUCCESS');
};

const testTerminationRequestValidation = async () => {
  log('✅ Testing Termination Request Validation...');
  
  if (!testConfig.testLeaseId) {
    log('Skipping termination request validation test - no lease available', 'ERROR');
    return;
  }
  
  // Test 1: Create termination request with valid date (2 months from now)
  const validEndDate = new Date();
  validEndDate.setMonth(validEndDate.getMonth() + 2);
  validEndDate.setDate(0); // Last day of the month
  
  const validRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/terminations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      proposedEndDate: validEndDate.toISOString(),
      reason: 'Testing valid termination request'
    })
  });
  
  assert(validRequest.success, 'Valid termination request should succeed');
  if (validRequest.success) {
    testConfig.testTerminationId = validRequest.data.terminationRequest.id;
    log(`Valid termination request created with ID: ${testConfig.testTerminationId}`, 'SUCCESS');
  }
  
  // Test 2: Create termination request with invalid (too early) date
  const invalidEndDate = new Date();
  invalidEndDate.setDate(invalidEndDate.getDate() + 5); // Too early
  
  const invalidRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/terminations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      proposedEndDate: invalidEndDate.toISOString(),
      reason: 'Testing invalid termination request'
    })
  });
  
  assert(!invalidRequest.success, 'Invalid termination request should fail');
  if (!invalidRequest.success) {
    assert(invalidRequest.data?.error?.includes('Invalid termination date'), 
      'Should return appropriate error message');
    assert(invalidRequest.data?.earliestEnd, 'Should include earliest end date');
    assert(invalidRequest.data?.policy, 'Should include policy information');
    log('Invalid termination request correctly rejected', 'SUCCESS');
  }
  
  // Test 3: Create termination request without proposed date (should use earliest)
  const autoRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/terminations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    },
    body: JSON.stringify({
      reason: 'Testing auto termination date'
    })
  });
  
  assert(autoRequest.success, 'Auto termination request should succeed');
  if (autoRequest.success) {
    const termination = autoRequest.data.terminationRequest;
    assert(termination.proposedEndDate, 'Should have proposed end date');
    assert(termination.terminationPolicyJson, 'Should store policy snapshot');
    log('Auto termination request created successfully', 'SUCCESS');
  }
  
  log('Termination request validation test passed!', 'SUCCESS');
};

const testTerminationWorkflow = async () => {
  log('🔄 Testing Termination Workflow...');
  
  if (!testConfig.testTerminationId) {
    log('Skipping termination workflow test - no termination request available', 'ERROR');
    return;
  }
  
  // Test 1: Accept termination request
  const acceptTermination = await makeRequest(`/terminations/${testConfig.testTerminationId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    }
  });
  
  assert(acceptTermination.success, 'Termination acceptance should succeed');
  log('Termination request accepted successfully', 'SUCCESS');
  
  // Test 2: Try to accept already accepted termination (should fail)
  const duplicateAccept = await makeRequest(`/terminations/${testConfig.testTerminationId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(!duplicateAccept.success, 'Duplicate acceptance should fail');
  log('Duplicate acceptance correctly rejected', 'SUCCESS');
  
  // Test 3: Test unauthorized access
  const unauthorizedAccept = await makeRequest(`/terminations/invalid-id/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(!unauthorizedAccept.success, 'Unauthorized access should fail');
  log('Unauthorized access correctly rejected', 'SUCCESS');
  
  log('Termination workflow test passed!', 'SUCCESS');
};

const testDashboardIntegration = async () => {
  log('📊 Testing Dashboard Integration...');
  
  // Test tenant dashboard includes termination policy preview
  const tenantDashboard = await makeRequest('/tenant-dashboard/dashboard', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(tenantDashboard.success, 'Tenant dashboard should be accessible');
  if (tenantDashboard.success) {
    assert(tenantDashboard.data.terminationPolicyPreview, 'Should include termination policy preview');
    const policy = tenantDashboard.data.terminationPolicyPreview;
    assert(policy.cutoffDay === 10, 'Dashboard policy should have correct cutoff day');
    assert(policy.minNoticeDays === 30, 'Dashboard policy should have correct min notice days');
    log('Tenant dashboard integration test passed!', 'SUCCESS');
  }
  
  // Test landlord tenant details include termination policy preview
  const landlordTenants = await makeRequest('/landlord/tenants', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    }
  });
  
  assert(landlordTenants.success, 'Landlord tenants should be accessible');
  if (landlordTenants.success && landlordTenants.data.tenants.length > 0) {
    const tenant = landlordTenants.data.tenants[0];
    assert(tenant.terminationPolicyPreview, 'Should include termination policy preview');
    const policy = tenant.terminationPolicyPreview;
    assert(policy.cutoffDay === 10, 'Landlord tenant policy should have correct cutoff day');
    assert(policy.minNoticeDays === 30, 'Landlord tenant policy should have correct min notice days');
    log('Landlord tenant details integration test passed!', 'SUCCESS');
  }
  
  log('Dashboard integration test passed!', 'SUCCESS');
};

const printResults = () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TERMINATION POLICY TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TERMINATION POLICY TESTS PASSED!');
    console.log('The termination policy implementation is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('='.repeat(60));
};

const runTests = async () => {
  console.log('🚀 Starting Termination Policy Tests...\n');
  console.log('Make sure the backend server is running on port 3001\n');
  
  try {
    await testAuthentication();
    await createTestLease();
    await testTerminationPolicyPreview();
    await testTerminationRequestValidation();
    await testTerminationWorkflow();
    await testDashboardIntegration();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Test execution error: ${error.message}`);
  }
  
  printResults();
};

// Run the tests
runTests().catch(console.error);
