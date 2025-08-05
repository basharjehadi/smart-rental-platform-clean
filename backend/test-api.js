import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoints...\n');

    // First, let's try to login to get a token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'tenant@test.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');

    // Test the dashboard endpoint
    console.log('\n2. Testing dashboard endpoint...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/tenant-dashboard/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Dashboard response received');
    console.log('Response status:', dashboardResponse.status);
    console.log('Response data keys:', Object.keys(dashboardResponse.data));
    console.log('Has active lease:', dashboardResponse.data.hasActiveLease);
    console.log('Property:', dashboardResponse.data.property ? 'Found' : 'Not found');
    console.log('Landlord:', dashboardResponse.data.landlord ? 'Found' : 'Not found');
    console.log('Payments count:', dashboardResponse.data.payments?.length || 0);

  } catch (error) {
    console.error('❌ Error in API test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI(); 