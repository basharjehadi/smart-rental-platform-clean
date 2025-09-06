/**
 * Simple Lease Lifecycle Test Script (ES Module)
 * 
 * This script tests the lease renewal and termination system step by step
 */

const BASE_URL = 'http://localhost:3001/api';

// Utility functions
async function makeRequest(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const data = await response.json();
  return { response, data };
}

async function login(email, password) {
  const { response, data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${data.message || response.statusText}`);
  }
  
  return data.token;
}

async function getWithAuth(url, token) {
  const { response, data } = await makeRequest(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${data.message || response.statusText}`);
  }
  
  return data;
}

async function postWithAuth(url, body, token) {
  const { response, data } = await makeRequest(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${data.message || response.statusText}`);
  }
  
  return data;
}

// Test functions
async function findActiveLease(tenantToken) {
  console.log('🔍 Finding active lease...');
  
  const dashboard = await getWithAuth('/tenant-dashboard/dashboard', tenantToken);
  const activeLease = dashboard.leases?.find(lease => 
    lease.status === 'ACTIVE' || lease.status === 'SIGNED'
  );
  
  if (!activeLease) {
    throw new Error('No active lease found for tenant@test.com');
  }
  
  console.log(`✅ Found active lease: ${activeLease.id} (${activeLease.status})`);
  return activeLease;
}

async function testRenewalRequest(tenantToken, leaseId) {
  console.log('\n🔄 Testing Renewal Request...');
  
  try {
    const renewalRequest = await postWithAuth(
      `/leases/${leaseId}/renewals`,
      { note: 'Test renewal request from automated test' },
      tenantToken
    );
    
    console.log('✅ Renewal request created:', renewalRequest.renewalRequest.id);
    return renewalRequest.renewalRequest.id;
    
  } catch (error) {
    console.error('❌ Renewal request failed:', error.message);
    throw error;
  }
}

async function testLandlordProposal(landlordToken, renewalId) {
  console.log('\n🏠 Testing Landlord Proposal...');
  
  try {
    const proposal = await postWithAuth(
      `/renewals/${renewalId}/propose`,
      {
        proposedTermMonths: 12,
        proposedMonthlyRent: 1200,
        proposedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Test landlord proposal - 12 months, $1200/month'
      },
      landlordToken
    );
    
    console.log('✅ Landlord proposal created');
    return proposal;
    
  } catch (error) {
    console.error('❌ Landlord proposal failed:', error.message);
    throw error;
  }
}

async function testTenantResponse(tenantToken, renewalId, accept = true) {
  const action = accept ? 'Acceptance' : 'Decline';
  console.log(`\n👤 Testing Tenant ${action}...`);
  
  try {
    const response = await postWithAuth(
      `/renewals/${renewalId}/respond`,
      { 
        accepted: accept, 
        note: `Test ${action.toLowerCase()}` 
      },
      tenantToken
    );
    
    console.log(`✅ Tenant ${action.toLowerCase()}d proposal`);
    return response;
    
  } catch (error) {
    console.error(`❌ Tenant ${action} failed:`, error.message);
    throw error;
  }
}

async function testTerminationRequest(tenantToken, leaseId) {
  console.log('\n🔚 Testing Termination Request...');
  
  try {
    const termination = await postWithAuth(
      `/leases/${leaseId}/terminations`,
      {
        proposedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Test termination request'
      },
      tenantToken
    );
    
    console.log('✅ Termination request created:', termination.terminationRequest.id);
    return termination.terminationRequest.id;
    
  } catch (error) {
    console.error('❌ Termination request failed:', error.message);
    throw error;
  }
}

async function testTerminationPolicy(tenantToken, leaseId) {
  console.log('\n📅 Testing Termination Policy...');
  
  try {
    const policy = await getWithAuth(
      `/leases/${leaseId}/termination-policy`,
      tenantToken
    );
    
    console.log('✅ Termination policy preview:');
    console.log(`   Cutoff Day: ${policy.cutoffDay}`);
    console.log(`   Min Notice: ${policy.minNoticeDays} days`);
    console.log(`   Earliest End: ${policy.earliestEnd}`);
    console.log(`   Explanation: ${policy.explanation}`);
    
    return policy;
    
  } catch (error) {
    console.error('❌ Termination policy test failed:', error.message);
    throw error;
  }
}

async function testLandlordTermination(landlordToken, leaseId) {
  console.log('\n🏠 Testing Landlord Termination...');
  
  try {
    const termination = await postWithAuth(
      `/leases/${leaseId}/terminations`,
      {
        proposedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Test landlord termination request'
      },
      landlordToken
    );
    
    console.log('✅ Landlord termination request created:', termination.terminationRequest.id);
    return termination.terminationRequest.id;
    
  } catch (error) {
    console.error('❌ Landlord termination failed:', error.message);
    throw error;
  }
}

async function testTerminationAcceptance(tenantToken, terminationId) {
  console.log('\n✅ Testing Termination Acceptance...');
  
  try {
    const response = await postWithAuth(
      `/terminations/${terminationId}/accept`,
      { note: 'Test acceptance' },
      tenantToken
    );
    
    console.log('✅ Termination accepted');
    return response;
    
  } catch (error) {
    console.error('❌ Termination acceptance failed:', error.message);
    throw error;
  }
}

async function testTerminationDecline(landlordToken, terminationId) {
  console.log('\n❌ Testing Termination Decline...');
  
  try {
    const response = await postWithAuth(
      `/terminations/${terminationId}/decline`,
      { note: 'Test decline' },
      landlordToken
    );
    
    console.log('✅ Termination declined');
    return response;
    
  } catch (error) {
    console.error('❌ Termination decline failed:', error.message);
    throw error;
  }
}

// Main test runner
async function runTest() {
  console.log('🚀 Starting Lease Lifecycle Test');
  console.log('================================');
  
  let tenantToken, landlordToken, leaseId;
  
  try {
    // Login
    console.log('🔐 Logging in...');
    tenantToken = await login('tenant@test.com', 'password123');
    landlordToken = await login('landlord@test.com', 'password123');
    console.log('✅ Logged in successfully');
    
    // Find active lease
    const lease = await findActiveLease(tenantToken);
    leaseId = lease.id;
    
    // Test renewal workflow
    console.log('\n' + '='.repeat(50));
    console.log('TESTING RENEWAL WORKFLOW');
    console.log('='.repeat(50));
    
    const renewalId = await testRenewalRequest(tenantToken, leaseId);
    await testLandlordProposal(landlordToken, renewalId);
    await testTenantResponse(tenantToken, renewalId, true);
    
    // Test termination workflow
    console.log('\n' + '='.repeat(50));
    console.log('TESTING TERMINATION WORKFLOW');
    console.log('='.repeat(50));
    
    await testTerminationPolicy(tenantToken, leaseId);
    const tenantTerminationId = await testTerminationRequest(tenantToken, leaseId);
    const landlordTerminationId = await testLandlordTermination(landlordToken, leaseId);
    
    // Test termination responses
    await testTerminationAcceptance(tenantToken, landlordTerminationId);
    await testTerminationDecline(landlordToken, tenantTerminationId);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Renewal workflow: PASSED');
    console.log('✅ Termination workflow: PASSED');
    console.log('✅ Termination policy: PASSED');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
runTest().catch(console.error);
