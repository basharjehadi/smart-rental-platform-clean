/**
 * Debug Lease ID Script
 * 
 * This script checks what type of record the lease ID actually is
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

async function debugLeaseId() {
  console.log('🔍 Debugging lease ID...');
  
  try {
    // Login as tenant
    const tenantToken = await login('tenant@test.com', 'password123');
    console.log('✅ Logged in as tenant');
    
    // Get tenant dashboard data
    const dashboard = await makeRequest('/tenant-dashboard/dashboard', {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    
    console.log('\n📊 Dashboard Response:');
    console.log('=====================');
    console.log('Status:', dashboard.response.status);
    console.log('Leases count:', dashboard.data.leases?.length || 0);
    console.log('Rental requests count:', dashboard.data.rentalRequests?.length || 0);
    
    if (dashboard.data.leases && dashboard.data.leases.length > 0) {
      console.log('\n🏠 Lease Details:');
      const lease = dashboard.data.leases[0];
      console.log('Lease object:', JSON.stringify(lease, null, 2));
    }
    
    if (dashboard.data.rentalRequests && dashboard.data.rentalRequests.length > 0) {
      console.log('\n📝 Rental Request Details:');
      const request = dashboard.data.rentalRequests[0];
      console.log('Rental request object:', JSON.stringify(request, null, 2));
      
      if (request.offers && request.offers.length > 0) {
        console.log('\n💼 Offer Details:');
        const offer = request.offers[0];
        console.log('Offer object:', JSON.stringify(offer, null, 2));
      }
    }
    
    // Try to find a lease by offer ID
    const offerId = 'cmf5ygkwe000jexb8lekup0qr';
    console.log(`\n🔍 Trying to get lease by offer ID: ${offerId}`);
    
    try {
      const leaseByOffer = await makeRequest(`/leases/by-offer/${offerId}`, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });
      
      console.log('Lease by offer response:');
      console.log('Status:', leaseByOffer.response.status);
      console.log('Data:', JSON.stringify(leaseByOffer.data, null, 2));
      
      if (leaseByOffer.data.lease) {
        const leaseId = leaseByOffer.data.lease.id;
        console.log(`\n🔍 Trying termination policy with lease ID: ${leaseId}`);
        
        try {
          const policy = await makeRequest(`/leases/${leaseId}/termination-policy`, {
            headers: { Authorization: `Bearer ${tenantToken}` },
          });
          
          console.log('Termination policy response:');
          console.log('Status:', policy.response.status);
          console.log('Data:', JSON.stringify(policy.data, null, 2));
          
        } catch (policyError) {
          console.log('Termination policy error:', policyError.message);
        }
      }
      
    } catch (offerError) {
      console.log('Lease by offer error:', offerError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the debug
debugLeaseId().catch(console.error);


