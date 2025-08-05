import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Test tenant login and dashboard data
async function testTenantDashboard() {
  try {
    console.log('🧪 Testing Tenant Dashboard API...\n');

    // Step 1: Login as tenant
    console.log('1. Logging in as tenant...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'tenant@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Test tenant dashboard endpoint
    console.log('2. Fetching tenant dashboard data...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/api/tenant-dashboard/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Dashboard data fetched successfully');
    console.log('📊 Dashboard Data:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));

    // Step 3: Test tenant payments endpoint
    console.log('\n3. Fetching tenant payments...');
    const paymentsResponse = await axios.get(`${API_BASE_URL}/api/tenant-dashboard/payments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Payments data fetched successfully');
    console.log('💰 Payments Data:');
    console.log(JSON.stringify(paymentsResponse.data, null, 2));

    // Step 4: Test tenant active lease endpoint
    console.log('\n4. Fetching tenant active lease...');
    const leaseResponse = await axios.get(`${API_BASE_URL}/api/tenant-dashboard/active-lease`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Active lease data fetched successfully');
    console.log('🏠 Lease Data:');
    console.log(JSON.stringify(leaseResponse.data, null, 2));

    console.log('\n🎉 All tenant dashboard API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have a tenant account created. You can create one using the registration endpoint.');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Tip: The endpoint might not exist. Check if the backend server is running and the routes are properly configured.');
    }
    
    // Log the full error for debugging
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testTenantDashboard(); 