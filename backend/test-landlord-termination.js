/**
 * 🏠 Landlord Termination Policy Test
 * 
 * Tests the landlord tenant endpoint to see if termination policy preview is included
 * 
 * Run with: node test-landlord-termination.js
 */

const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  landlordToken: null,
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

// Logging helper
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const icon = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : 'ℹ️';
  console.log(`${icon} [${timestamp}] ${message}`);
};

const testLandlordTenants = async () => {
  log('🔐 Testing Landlord Authentication...');
  
  // Test landlord login
  const landlordLogin = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'landlord@test.com',
      password: 'password123'
    })
  });
  
  if (!landlordLogin.success) {
    log('Landlord login failed', 'ERROR');
    return;
  }
  
  testConfig.landlordToken = landlordLogin.data.token;
  log('Landlord authentication successful!', 'SUCCESS');
  
  log('🏠 Testing Landlord Tenants Endpoint...');
  
  // Test landlord tenants endpoint
  const landlordTenants = await makeRequest('/landlord/tenants', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testConfig.landlordToken}`
    }
  });
  
  if (!landlordTenants.success) {
    log(`Landlord tenants endpoint failed: ${landlordTenants.status}`, 'ERROR');
    log(`Response: ${JSON.stringify(landlordTenants.data)}`);
    return;
  }
  
  log('Landlord tenants endpoint successful!', 'SUCCESS');
  log(`Found ${landlordTenants.data.tenants.length} tenant(s)`);
  
  // Check each tenant for termination policy preview
  landlordTenants.data.tenants.forEach((tenant, index) => {
    log(`\n📋 Tenant ${index + 1}: ${tenant.name}`);
    log(`  Email: ${tenant.email}`);
    log(`  Move-in Date: ${tenant.moveInDate}`);
    log(`  Lease Start: ${tenant.leaseStartDate}`);
    log(`  Lease End: ${tenant.leaseEndDate}`);
    log(`  Days Rented: ${tenant.daysRented}`);
    log(`  Payment Status: ${tenant.paymentStatus}`);
    
    if (tenant.terminationPolicyPreview) {
      log('  ✅ Termination Policy Preview:', 'SUCCESS');
      log(`    Cutoff Day: ${tenant.terminationPolicyPreview.cutoffDay}`);
      log(`    Min Notice Days: ${tenant.terminationPolicyPreview.minNoticeDays}`);
      log(`    Timezone: ${tenant.terminationPolicyPreview.timezone}`);
      log(`    Earliest End: ${tenant.terminationPolicyPreview.earliestEnd}`);
      log(`    Explanation: ${tenant.terminationPolicyPreview.explanation}`);
    } else {
      log('  ❌ No Termination Policy Preview', 'ERROR');
    }
  });
  
  // Check if any tenant has termination policy preview
  const hasTerminationPolicy = landlordTenants.data.tenants.some(tenant => tenant.terminationPolicyPreview);
  
  if (hasTerminationPolicy) {
    log('\n🎉 Termination policy preview is working for landlord!', 'SUCCESS');
  } else {
    log('\n⚠️ No tenant has termination policy preview - this might be expected if no active leases exist', 'ERROR');
  }
};

const runTest = async () => {
  console.log('🚀 Starting Landlord Termination Policy Test...\n');
  console.log('Make sure the backend server is running on port 3001\n');
  
  try {
    await testLandlordTenants();
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'ERROR');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏠 LANDLORD TERMINATION POLICY TEST COMPLETE');
  console.log('='.repeat(60));
};

// Run the test
runTest().catch(console.error);


