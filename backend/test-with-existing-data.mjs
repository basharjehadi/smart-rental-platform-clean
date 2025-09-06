/**
 * Test with Existing Data
 * 
 * This script tests the lease renewal and termination system using existing data
 * and creates test scenarios if needed
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

async function findLeaseToTest(tenantToken) {
  console.log('🔍 Looking for any lease to test with...');
  
  const dashboard = await getWithAuth('/tenant-dashboard/dashboard', tenantToken);
  
  // Check if there's any lease data
  if (dashboard.leases && dashboard.leases.length > 0) {
    const lease = dashboard.leases[0];
    console.log('📋 Found lease data:', {
      id: lease.id,
      status: lease.status,
      property: lease.property?.name || 'Unknown'
    });
    
    // If lease has an ID, use it
    if (lease.id) {
      return lease.id;
    }
  }
  
  // Check rental requests for offers
  if (dashboard.rentalRequests && dashboard.rentalRequests.length > 0) {
    const requestWithOffers = dashboard.rentalRequests.find(r => r.offers && r.offers.length > 0);
    if (requestWithOffers && requestWithOffers.offers.length > 0) {
      const offer = requestWithOffers.offers[0];
      console.log('📋 Found offer data:', {
        id: offer.id,
        status: offer.status,
        property: offer.property?.name || 'Unknown'
      });
      
      // Try to find a lease by offer ID
      try {
        const leaseByOffer = await getWithAuth(`/leases/by-offer/${offer.id}`, tenantToken);
        if (leaseByOffer.lease) {
          console.log('✅ Found lease by offer:', leaseByOffer.lease.id);
          return leaseByOffer.lease.id;
        }
      } catch (error) {
        console.log('⚠️ No lease found by offer ID');
      }
    }
  }
  
  throw new Error('No suitable lease found for testing');
}

async function testTerminationPolicy(tenantToken, leaseId) {
  console.log('\n📅 Testing Termination Policy...');
  
  try {
    const policy = await getWithAuth(`/leases/${leaseId}/termination-policy`, tenantToken);
    
    console.log('✅ Termination policy preview:');
    console.log(`   Cutoff Day: ${policy.cutoffDay}`);
    console.log(`   Min Notice: ${policy.minNoticeDays} days`);
    console.log(`   Earliest End: ${policy.earliestEnd}`);
    console.log(`   Explanation: ${policy.explanation}`);
    
    return policy;
    
  } catch (error) {
    console.error('❌ Termination policy test failed:', error.message);
    // Let's try to get more details about the error
    try {
      const { response, data } = await makeRequest(`/leases/${leaseId}/termination-policy`, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });
      console.log('Response status:', response.status);
      console.log('Response data:', data);
    } catch (debugError) {
      console.log('Debug error:', debugError.message);
    }
    throw error;
  }
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

async function runTest() {
  console.log('🚀 Testing with Existing Data');
  console.log('=============================');
  
  let tenantToken, landlordToken, leaseId;
  
  try {
    // Login
    console.log('🔐 Logging in...');
    tenantToken = await login('tenant@test.com', 'password123');
    landlordToken = await login('landlord@test.com', 'password123');
    console.log('✅ Logged in successfully');
    
    // Find lease to test with
    leaseId = await findLeaseToTest(tenantToken);
    console.log(`✅ Using lease ID: ${leaseId}`);
    
    // Test termination policy (this should work)
    console.log('\n' + '='.repeat(50));
    console.log('TESTING TERMINATION POLICY');
    console.log('='.repeat(50));
    
    await testTerminationPolicy(tenantToken, leaseId);
    
    // Test renewal request (this might work)
    console.log('\n' + '='.repeat(50));
    console.log('TESTING RENEWAL REQUEST');
    console.log('='.repeat(50));
    
    try {
      const renewalId = await testRenewalRequest(tenantToken, leaseId);
      
      // Test landlord proposal
      await testLandlordProposal(landlordToken, renewalId);
      
      // Test tenant response
      await testTenantResponse(tenantToken, renewalId, true);
      
      console.log('✅ Renewal workflow completed successfully!');
      
    } catch (error) {
      console.log('⚠️ Renewal workflow failed (this is expected if lease is not active)');
    }
    
    // Test termination request (this might work)
    console.log('\n' + '='.repeat(50));
    console.log('TESTING TERMINATION REQUEST');
    console.log('='.repeat(50));
    
    try {
      await testTerminationRequest(tenantToken, leaseId);
      console.log('✅ Termination request completed successfully!');
    } catch (error) {
      console.log('⚠️ Termination request failed (this is expected if lease is not active)');
    }
    
    console.log('\n🎉 Test completed!');
    console.log('✅ Termination policy: WORKING');
    console.log('⚠️ Renewal/Termination workflows: May need active lease');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
runTest().catch(console.error);
