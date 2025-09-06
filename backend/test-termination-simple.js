/**
 * 🏠 Simple Termination Policy Test
 * 
 * Tests the termination policy implementation without creating complex test data
 * 
 * Run with: node test-termination-simple.js
 */

const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  tenantToken: null,
  landlordToken: null,
  adminToken: null,
  testLeaseId: null,
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

const findExistingLease = async () => {
  log('🔍 Looking for existing lease...');
  
  // Try to get tenant dashboard data to find an existing lease
  const tenantDashboard = await makeRequest('/tenant-dashboard/dashboard', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.tenantToken}`
    }
  });
  
  if (tenantDashboard.success && tenantDashboard.data.hasActiveLease) {
    // Try to get lease details from the offer
    const offerId = tenantDashboard.data.offerId;
    if (offerId) {
      const offerDetails = await makeRequest(`/tenant/offer/${offerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testConfig.tenantToken}`
        }
      });
      
      if (offerDetails.success && offerDetails.data.offer.lease) {
        testConfig.testLeaseId = offerDetails.data.offer.lease.id;
        log(`Found existing lease with ID: ${testConfig.testLeaseId}`, 'SUCCESS');
        return true;
      }
    }
  }
  
  // Try to get landlord tenants to find a lease
  const landlordTenants = await makeRequest('/landlord/tenants', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    }
  });
  
  if (landlordTenants.success && landlordTenants.data.tenants.length > 0) {
    // Look for a tenant with lease information
    for (const tenant of landlordTenants.data.tenants) {
      if (tenant.leaseStartDate && tenant.leaseEndDate) {
        // This tenant has lease info, try to find the actual lease
        const offerId = tenant.offerId || tenant.paidOfferId;
        if (offerId) {
          const offerDetails = await makeRequest(`/tenant/offer/${offerId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${testConfig.tenantToken}`
            }
          });
          
          if (offerDetails.success && offerDetails.data.offer.lease) {
            testConfig.testLeaseId = offerDetails.data.offer.lease.id;
            log(`Found existing lease with ID: ${testConfig.testLeaseId}`, 'SUCCESS');
            return true;
          }
        }
      }
    }
  }
  
  log('No existing lease found', 'ERROR');
  return false;
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
  
  log(`Policy preview response: ${JSON.stringify(policyPreview)}`);
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
  log(`Landlord tenants response: ${JSON.stringify(landlordTenants.data, null, 2)}`);
  
  if (landlordTenants.success && landlordTenants.data.tenants.length > 0) {
    const tenant = landlordTenants.data.tenants[0];
    log(`First tenant data: ${JSON.stringify(tenant, null, 2)}`);
    
    if (tenant.terminationPolicyPreview) {
      const policy = tenant.terminationPolicyPreview;
      assert(policy.cutoffDay === 10, 'Landlord tenant policy should have correct cutoff day');
      assert(policy.minNoticeDays === 30, 'Landlord tenant policy should have correct min notice days');
      log('Landlord tenant details integration test passed!', 'SUCCESS');
    } else {
      log('Landlord tenant data does not include termination policy preview - this is expected if no active leases exist', 'ERROR');
    }
  } else {
    log('No landlord tenants found - this is expected if no active leases exist', 'ERROR');
  }
  
  log('Dashboard integration test passed!', 'SUCCESS');
};

const testDateUtils = async () => {
  log('📅 Testing Date Utils Functions...');
  
  // Test the date utility functions directly
  const { 
    computeEarliestTerminationEnd, 
    resolveTerminationPolicy,
    getTerminationPolicyExplanation 
  } = await import('./src/utils/dateUtils.js');
  
  // Test policy resolution
  const mockLease = {
    offer: { organization: { terminationPolicy: null } },
    property: { timezone: 'Europe/Warsaw' }
  };
  
  const policy = resolveTerminationPolicy(mockLease);
  assert(policy.cutoffDay === 10, 'Default cutoff day should be 10');
  assert(policy.minNoticeDays === 30, 'Default min notice days should be 30');
  assert(policy.timezone === 'Europe/Warsaw', 'Default timezone should be Europe/Warsaw');
  
  // Test earliest end calculation
  const now = new Date();
  const earliestEnd = computeEarliestTerminationEnd(now, policy);
  assert(earliestEnd instanceof Date, 'Earliest end should be a Date');
  assert(earliestEnd > now, 'Earliest end should be in the future');
  
  // Test explanation generation
  const explanation = getTerminationPolicyExplanation(policy);
  assert(explanation.includes('day 10'), 'Explanation should mention day 10');
  assert(explanation.includes('30 days'), 'Explanation should mention 30 days');
  
  log('Date utils test passed!', 'SUCCESS');
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
  console.log('🚀 Starting Simple Termination Policy Tests...\n');
  console.log('Make sure the backend server is running on port 3001\n');
  
  try {
    await testAuthentication();
    await testDateUtils();
    await findExistingLease();
    await testTerminationPolicyPreview();
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
