import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let authToken = '';

const testSimpleRequest = async () => {
  try {
    console.log('🧪 Testing Simple Rental Request Creation...\n');

    // Step 1: Login as tenant
    console.log('1️⃣ Logging in as tenant...');
    const loginResponse = await api.post('/auth/login', {
      email: 'tenant@test.com',
      password: 'tenant123'
    });

    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }

    // Step 2: Create a simple rental request with only required fields
    console.log('\n2️⃣ Creating simple rental request...');
    const requestData = {
      title: 'Looking for Apartment in Warsaw',
      description: 'Looking for a modern apartment in Warsaw.',
      location: 'Warsaw',
      budget: 3000,
      moveInDate: '2024-12-01'
    };

    console.log('📋 Request data:', requestData);

    const createResponse = await api.post('/rental-request', requestData);
    
    if (createResponse.status === 201) {
      console.log('✅ Rental request created successfully');
      console.log('📋 Response:', createResponse.data);
    } else {
      console.log('❌ Failed to create rental request:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
  }
};

// Run the test
testSimpleRequest(); 