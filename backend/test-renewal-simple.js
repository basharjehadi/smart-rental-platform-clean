/**
 * Simple End-to-End Test for Lease Renewal System
 * 
 * This test can be run with: node test-renewal-simple.js
 * Make sure the backend server is running on port 3001
 */

const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  tenantEmail: 'tenant@test.com',
  landlordEmail: 'landlord@test.com',
  adminEmail: 'admin@test.com',
  tenantToken: null,
  landlordToken: null,
  adminToken: null,
  testLeaseId: null,
  testRenewalId: null
};

// Test results
const results = {
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
    results.passed++;
    log(`PASS: ${message}`, 'SUCCESS');
  } else {
    results.failed++;
    results.errors.push(message);
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
      email: testConfig.tenantEmail,
      password: 'password123'
    })
  });
  
  assert(tenantLogin.success, 'Tenant login should succeed');
  if (tenantLogin.success) {
    testConfig.tenantToken = tenantLogin.data.token;
  }
  
  // Test landlord login
  const landlordLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testConfig.landlordEmail,
      password: 'password123'
    })
  });
  
  assert(landlordLogin.success, 'Landlord login should succeed');
  if (landlordLogin.success) {
    testConfig.landlordToken = landlordLogin.data.token;
  }
  
  // Test admin login
  const adminLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testConfig.adminEmail,
      password: 'password123'
    })
  });
  
  assert(adminLogin.success, 'Admin login should succeed');
  if (adminLogin.success) {
    testConfig.adminToken = adminLogin.data.token;
  }
};

const testRenewalEndpoints = async () => {
  log('🔄 Testing Renewal Endpoints...');
  
  // First, we need to find an existing lease or create one
  // For this test, we'll assume there's an existing lease
  // In a real scenario, you'd create a lease first
  
  // Test 1: Get existing leases (if any)
  const leasesResponse = await makeRequest('/leases', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  if (leasesResponse.success && leasesResponse.data.leases && leasesResponse.data.leases.length > 0) {
    testConfig.testLeaseId = leasesResponse.data.leases[0].id;
    log(`Using existing lease: ${testConfig.testLeaseId}`);
  } else {
    log('No existing leases found. Creating a test lease...');
    // In a real test, you'd create a lease here
    // For now, we'll skip this test
    log('Skipping renewal tests - no lease available', 'ERROR');
    return;
  }
  
  // Test 2: Tenant sends renewal request (note only)
  const tenantRenewalRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      note: 'I would like to renew my lease for another year'
    })
  });
  
  assert(tenantRenewalRequest.success, 'Tenant renewal request should succeed');
  if (tenantRenewalRequest.success) {
    testConfig.testRenewalId = tenantRenewalRequest.data.renewal.id;
    log(`Created renewal request: ${testConfig.testRenewalId}`);
  }
  
  // Test 3: Check that tenant cannot set terms/rent
  const tenantWithTermsRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      note: 'I want to renew',
      proposedTermMonths: 12,
      proposedMonthlyRent: 1100
    })
  });
  
  assert(!tenantWithTermsRequest.success, 'Tenant should not be able to set terms/rent');
  if (!tenantWithTermsRequest.success) {
    assert(tenantWithTermsRequest.data?.error?.includes('cannot propose renewal terms'), 
      'Should return appropriate error message');
  }
  
  // Test 4: Landlord proposes renewal terms
  const landlordProposal = await makeRequest(`/leases/${testConfig.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    },
    body: JSON.stringify({
      proposedTermMonths: 12,
      proposedMonthlyRent: 1100,
      proposedStartDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      note: 'Happy to renew with a 10% rent increase'
    })
  });
  
  assert(landlordProposal.success, 'Landlord proposal should succeed');
  
  // Test 5: Get renewal workflow state
  const workflowState = await makeRequest(`/leases/${testConfig.testLeaseId}/renewal-workflow`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(workflowState.success, 'Workflow state should be retrievable');
  if (workflowState.success) {
    const workflow = workflowState.data.workflow;
    assert(workflow.hasActiveRenewal, 'Should have active renewal');
    assert(workflow.canAcceptRenewal, 'Tenant should be able to accept renewal');
    assert(!workflow.canRequestRenewal, 'Tenant should not be able to request new renewal');
  }
  
  // Test 6: Get all renewals for the lease
  const renewalsList = await makeRequest(`/leases/${testConfig.testLeaseId}/renewals`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(renewalsList.success, 'Should be able to get renewals list');
  if (renewalsList.success) {
    assert(renewalsList.data.renewals.length > 0, 'Should have at least one renewal');
  }
  
  // Test 7: Tenant accepts renewal
  if (testConfig.testRenewalId) {
    const acceptRenewal = await makeRequest(`/renewals/${testConfig.testRenewalId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testConfig.tenantToken}`
      }
    });
    
    assert(acceptRenewal.success, 'Tenant should be able to accept renewal');
  }
};

const testSecurityPermissions = async () => {
  log('🛡️ Testing Security and Permissions...');
  
  if (!testConfig.testLeaseId) {
    log('Skipping security tests - no lease available', 'ERROR');
    return;
  }
  
  // Test 1: Unauthorized access (no token)
  const unauthorizedAccess = await makeRequest(`/leases/${testConfig.testLeaseId}/renewals`, {
    method: 'POST',
    body: JSON.stringify({
      note: 'Unauthorized request'
    })
  });
  
  assert(!unauthorizedAccess.success, 'Unauthorized access should fail');
  
  // Test 2: Landlord trying to accept their own proposal
  if (testConfig.testRenewalId) {
    const landlordSelfAccept = await makeRequest(`/renewals/${testConfig.testRenewalId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testConfig.landlordToken}`
      }
    });
    
    assert(!landlordSelfAccept.success, 'Landlord should not be able to accept their own proposal');
  }
  
  // Test 3: Invalid renewal ID
  const invalidRenewalAccept = await makeRequest('/renewals/invalid-id/accept', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(!invalidRenewalAccept.success, 'Invalid renewal ID should fail');
};

const testAutoExpiration = async () => {
  log('⏰ Testing Auto-Expiration...');
  
  // Test the auto-expiration endpoint
  const expireResponse = await makeRequest('/renewals/expire-old', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.adminToken}`
    }
  });
  
  assert(expireResponse.success, 'Auto-expiration endpoint should be accessible');
  if (expireResponse.success) {
    assert(typeof expireResponse.data.expiredCount === 'number', 'Should return expired count');
  }
};

const testNotificationSystem = async () => {
  log('🔔 Testing Notification System...');
  
  if (!testConfig.testLeaseId) {
    log('Skipping notification tests - no lease available', 'ERROR');
    return;
  }
  
  // Test 1: Send a renewal request and check for notifications
  const tenantRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/renewals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      note: 'Testing notification system'
    })
  });
  
  assert(tenantRequest.success, 'Renewal request should succeed for notification test');
  
  // Test 2: Check if notifications were created
  const notificationsResponse = await makeRequest('/notifications', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    }
  });
  
  if (notificationsResponse.success) {
    const notifications = notificationsResponse.data.notifications || [];
    const renewalNotifications = notifications.filter(n => 
      n.title && n.title.includes('Renewal')
    );
    
    assert(renewalNotifications.length > 0, 'Should have renewal notifications');
  }
};

const testTerminationPolicy = async () => {
  log('🏠 Testing Termination Policy...');
  
  if (!testConfig.testLeaseId) {
    log('Skipping termination policy tests - no lease available', 'ERROR');
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
  if (policyPreview.success) {
    const policy = policyPreview.data.terminationPolicyPreview;
    assert(policy.cutoffDay === 10, 'Cutoff day should be 10');
    assert(policy.minNoticeDays === 30, 'Minimum notice days should be 30');
    assert(policy.timezone === 'Europe/Warsaw', 'Timezone should be Europe/Warsaw');
    assert(policy.earliestEnd, 'Should have earliest end date');
    assert(policy.explanation, 'Should have policy explanation');
  }
  
  // Test 2: Create termination request with valid date
  const validEndDate = new Date();
  validEndDate.setMonth(validEndDate.getMonth() + 2);
  validEndDate.setDate(0); // Last day of the month
  
  const validTerminationRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/terminations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      proposedEndDate: validEndDate.toISOString(),
      reason: 'Testing termination policy'
    })
  });
  
  assert(validTerminationRequest.success, 'Valid termination request should succeed');
  if (validTerminationRequest.success) {
    testConfig.testTerminationId = validTerminationRequest.data.terminationRequest.id;
  }
  
  // Test 3: Create termination request with invalid (too early) date
  const invalidEndDate = new Date();
  invalidEndDate.setDate(invalidEndDate.getDate() + 5); // Too early
  
  const invalidTerminationRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/terminations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    },
    body: JSON.stringify({
      proposedEndDate: invalidEndDate.toISOString(),
      reason: 'Testing invalid termination'
    })
  });
  
  assert(!invalidTerminationRequest.success, 'Invalid termination request should fail');
  if (!invalidTerminationRequest.success) {
    assert(invalidTerminationRequest.data?.error?.includes('Invalid termination date'), 
      'Should return appropriate error message');
    assert(invalidTerminationRequest.data?.earliestEnd, 'Should include earliest end date');
    assert(invalidTerminationRequest.data?.policy, 'Should include policy information');
  }
  
  // Test 4: Test cutoff day logic (if we can create a test lease)
  // This would require creating a lease with a specific start date
  // For now, we'll test the policy preview includes the correct explanation
  if (policyPreview.success) {
    const explanation = policyPreview.data.terminationPolicyPreview.explanation;
    assert(explanation.includes('day 10'), 'Explanation should mention day 10');
    assert(explanation.includes('next month'), 'Explanation should mention next month');
    assert(explanation.includes('month after next'), 'Explanation should mention month after next');
    assert(explanation.includes('30 days'), 'Explanation should mention 30 days minimum notice');
  }
  
  // Test 5: Test termination request without proposed date (should use earliest)
  const autoTerminationRequest = await makeRequest(`/leases/${testConfig.testLeaseId}/terminations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    },
    body: JSON.stringify({
      reason: 'Testing auto termination date'
    })
  });
  
  assert(autoTerminationRequest.success, 'Auto termination request should succeed');
  if (autoTerminationRequest.success) {
    const termination = autoTerminationRequest.data.terminationRequest;
    assert(termination.proposedEndDate, 'Should have proposed end date');
    assert(termination.terminationPolicyJson, 'Should store policy snapshot');
  }
};

const testTerminationWorkflow = async () => {
  log('🔄 Testing Termination Workflow...');
  
  if (!testConfig.testTerminationId) {
    log('Skipping termination workflow tests - no termination request available', 'ERROR');
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
  
  // Test 2: Try to accept already accepted termination (should fail)
  const duplicateAccept = await makeRequest(`/terminations/${testConfig.testTerminationId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(!duplicateAccept.success, 'Duplicate acceptance should fail');
  
  // Test 3: Test unauthorized access
  const unauthorizedAccept = await makeRequest(`/terminations/invalid-id/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  assert(!unauthorizedAccept.success, 'Unauthorized access should fail');
};

const printResults = () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
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
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! The lease renewal system is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('='.repeat(60) + '\n');
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Lease Renewal System Tests...\n');
  console.log('Make sure the backend server is running on port 3001\n');
  
  try {
    await testAuthentication();
    await testRenewalEndpoints();
    await testSecurityPermissions();
    await testAutoExpiration();
    await testNotificationSystem();
    await testTerminationPolicy();
    await testTerminationWorkflow();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'ERROR');
    results.failed++;
    results.errors.push(`Test execution error: ${error.message}`);
  } finally {
    printResults();
  }
};

// Run the tests
runTests().catch(console.error);
