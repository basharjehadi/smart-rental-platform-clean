import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const testLogin = async () => {
  try {
    console.log('🔍 Testing Login Endpoint...');
    
    // Test with a known user
    const loginData = {
      email: 'basic-test-tenant@example.com',
      password: 'tenant123'
    };
    
    console.log('   Attempting login with:', loginData.email);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    
    console.log('   ✅ Login successful!');
    console.log('   Token received:', response.data.token ? 'Yes' : 'No');
    console.log('   User role:', response.data.user?.role);
    console.log('   User name:', response.data.user?.name);
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
};

// Test the ping endpoint first
const testPing = async () => {
  try {
    console.log('🔍 Testing API connectivity...');
    const response = await axios.get(`${API_BASE_URL}/ping`);
    console.log('   ✅ API is responding:', response.data);
  } catch (error) {
    console.error('❌ API not responding:', error.message);
  }
};

const runTests = async () => {
  await testPing();
  console.log('');
  await testLogin();
};

runTests(); 