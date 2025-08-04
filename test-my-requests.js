import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let authToken = '';

const testMyRequests = async () => {
  try {
    console.log('🧪 Testing My Requests API...\n');

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

    // Step 2: Fetch user's rental requests
    console.log('\n2️⃣ Fetching user rental requests...');
    const requestsResponse = await api.get('/my-requests');
    
    if (requestsResponse.status === 200) {
      const requests = requestsResponse.data.rentalRequests || [];
      console.log('✅ Fetched rental requests successfully');
      console.log('📋 Total requests:', requests.length);
      
      if (requests.length > 0) {
        console.log('\n📋 Request details:');
        requests.forEach((request, index) => {
          console.log(`\n--- Request ${index + 1} ---`);
          console.log('ID:', request.id);
          console.log('Title:', request.title);
          console.log('Location:', request.location);
          console.log('Budget:', request.budget, 'PLN');
          console.log('Move-in Date:', request.moveInDate);
          console.log('Status:', request.status);
          console.log('Property Type:', request.propertyType || 'Not specified');
          console.log('Bedrooms:', request.bedrooms || 'Not specified');
          console.log('Description:', request.description);
          console.log('Created:', request.createdAt);
        });
      } else {
        console.log('📋 No rental requests found');
      }
    } else {
      console.log('❌ Failed to fetch rental requests:', requestsResponse.data);
    }

    console.log('\n🎉 My Requests test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Run the test
testMyRequests(); 