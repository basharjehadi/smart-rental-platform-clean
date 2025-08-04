import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const testLoginDirect = async () => {
  try {
    console.log('🧪 Testing Login Endpoint Directly...\n');

    console.log('1️⃣ Testing login with tenant credentials...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'tenant@test.com',
      password: 'tenant123'
    });

    console.log('✅ Login successful!');
    console.log('📋 Response status:', loginResponse.status);
    console.log('📋 Response data:', loginResponse.data);

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response data:', error.response.data);
      console.error('📋 Response headers:', error.response.headers);
    }
  }
};

// Run the test
testLoginDirect(); 