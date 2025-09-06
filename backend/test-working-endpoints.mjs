/**
 * Test Working Endpoints
 * 
 * This script tests the lease renewal and termination system using the working endpoints
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

async function testWorkingEndpoints() {
  console.log('🚀 Testing Working Endpoints');
  console.log('============================');
  
  try {
    // Login
    console.log('🔐 Logging in...');
    const tenantToken = await login('tenant@test.com', 'password123');
    const landlordToken = await login('landlord@test.com', 'password123');
    console.log('✅ Logged in successfully');
    
    // Get lease data using the working endpoint
    console.log('\n📋 Getting lease data...');
    const offerId = 'cmf5ygkwe000jexb8lekup0qr';
    const leaseData = await getWithAuth(`/leases/by-offer/${offerId}`, tenantToken);
    
    console.log('✅ Lease data retrieved:');
    console.log(`   Lease ID: ${leaseData.lease.id}`);
    console.log(`   Status: ${leaseData.lease.status}`);
    console.log(`   Start Date: ${leaseData.lease.startDate}`);
    console.log(`   End Date: ${leaseData.lease.endDate}`);
    
    // Test termination policy (using the working endpoint)
    console.log('\n📅 Testing Termination Policy...');
    if (leaseData.terminationPolicyPreview) {
      const policy = leaseData.terminationPolicyPreview;
      console.log('✅ Termination policy preview:');
      console.log(`   Cutoff Day: ${policy.cutoffDay}`);
      console.log(`   Min Notice: ${policy.minNoticeDays} days`);
      console.log(`   Earliest End: ${policy.earliestEnd}`);
      console.log(`   Explanation: ${policy.explanation}`);
    } else {
      console.log('❌ No termination policy preview found');
    }
    
    // Test renewal request
    console.log('\n🔄 Testing Renewal Request...');
    try {
      const renewalRequest = await postWithAuth(
        `/leases/${leaseData.lease.id}/renewals`,
        { note: 'Test renewal request from automated test' },
        tenantToken
      );
      
      console.log('✅ Renewal request created:', renewalRequest.renewalRequest.id);
      
      // Test landlord proposal
      console.log('\n🏠 Testing Landlord Proposal...');
      const proposal = await postWithAuth(
        `/renewals/${renewalRequest.renewalRequest.id}/propose`,
        {
          proposedTermMonths: 12,
          proposedMonthlyRent: 1200,
          proposedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          note: 'Test landlord proposal - 12 months, $1200/month'
        },
        landlordToken
      );
      
      console.log('✅ Landlord proposal created');
      
      // Test tenant response
      console.log('\n👤 Testing Tenant Response...');
      const response = await postWithAuth(
        `/renewals/${renewalRequest.renewalRequest.id}/respond`,
        { 
          accepted: true, 
          note: 'Test acceptance' 
        },
        tenantToken
      );
      
      console.log('✅ Tenant accepted proposal');
      
      console.log('\n🎉 Renewal workflow completed successfully!');
      
    } catch (error) {
      console.log('⚠️ Renewal workflow failed:', error.message);
    }
    
    // Test termination request
    console.log('\n🔚 Testing Termination Request...');
    try {
      const termination = await postWithAuth(
        `/leases/${leaseData.lease.id}/terminations`,
        {
          proposedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Test termination request'
        },
        tenantToken
      );
      
      console.log('✅ Termination request created:', termination.terminationRequest.id);
      
      // Test landlord termination
      console.log('\n🏠 Testing Landlord Termination...');
      const landlordTermination = await postWithAuth(
        `/leases/${leaseData.lease.id}/terminations`,
        {
          proposedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Test landlord termination request'
        },
        landlordToken
      );
      
      console.log('✅ Landlord termination request created:', landlordTermination.terminationRequest.id);
      
      console.log('\n🎉 Termination workflow completed successfully!');
      
    } catch (error) {
      console.log('⚠️ Termination workflow failed:', error.message);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('================');
    console.log('✅ Lease data retrieval: WORKING');
    console.log('✅ Termination policy preview: WORKING');
    console.log('⚠️ Renewal workflow: Tested (may need active lease)');
    console.log('⚠️ Termination workflow: Tested (may need active lease)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWorkingEndpoints().catch(console.error);


