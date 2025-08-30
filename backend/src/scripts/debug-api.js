import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

async function debugAPI() {
  try {
    console.log('🔍 Debugging API step by step...\n');

    // Step 1: Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health endpoint works:', healthResponse.status);

    // Step 2: Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'tenant@test.com',
      password: 'password123',
    });
    const token = loginResponse.data.token;
    console.log('✅ Login works, token received');

    // Step 3: Test what routes are actually available
    console.log('\n3. Testing different endpoints...');

    // Test auth endpoint
    try {
      await axios.get(`${API_BASE_URL}/auth/login`);
      console.log('✅ GET /api/auth/login works');
    } catch (error) {
      console.log('❌ GET /api/auth/login failed:', error.response?.status);
    }

    // Test tenant-dashboard endpoint
    try {
      await axios.get(`${API_BASE_URL}/tenant-dashboard/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ GET /api/tenant-dashboard/dashboard works');
    } catch (error) {
      console.log(
        '❌ GET /api/tenant-dashboard/dashboard failed:',
        error.response?.status,
        error.response?.data
      );
    }

    // Test without auth
    try {
      await axios.get(`${API_BASE_URL}/tenant-dashboard/dashboard`);
      console.log('✅ GET /api/tenant-dashboard/dashboard works without auth');
    } catch (error) {
      console.log(
        '❌ GET /api/tenant-dashboard/dashboard failed without auth:',
        error.response?.status,
        error.response?.data
      );
    }

    // Test the exact path that should work
    try {
      await axios.get(`${API_BASE_URL}/tenant-dashboard/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Dashboard endpoint works with auth');
    } catch (error) {
      console.log(
        '❌ Dashboard endpoint failed with auth:',
        error.response?.status,
        error.response?.data
      );
    }
  } catch (error) {
    console.error('❌ Error in debug:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugAPI();
