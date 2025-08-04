import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let authToken = '';

const testRentalRequest = async () => {
  try {
    console.log('🧪 Testing Rental Request Creation...\n');

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

    // Step 2: Create a rental request
    console.log('\n2️⃣ Creating rental request...');
    const requestData = {
      title: 'Looking for Apartment in Warsaw',
      description: 'Looking for a modern 2-bedroom apartment in Warsaw city center. Prefer furnished with parking.',
      location: 'Downtown, Warsaw',
      budget: 3500,
      budgetFrom: 3000,
      budgetTo: 4000,
      moveInDate: '2024-03-01',
      bedrooms: 2,
      propertyType: 'Apartment',
      city: 'Warsaw',
      district: 'Downtown',
      additionalRequirements: 'Furnished, parking, pets allowed, balcony preferred'
    };

    const createResponse = await api.post('/rental-request', requestData);
    
    if (createResponse.status === 201) {
      console.log('✅ Rental request created successfully');
      console.log('📋 Request ID:', createResponse.data.id);
      console.log('📋 Request details:', {
        title: createResponse.data.title,
        location: createResponse.data.location,
        budget: createResponse.data.budget,
        moveInDate: createResponse.data.moveInDate
      });
    } else {
      console.log('❌ Failed to create rental request:', createResponse.data);
      return;
    }

    // Step 3: Fetch user's rental requests
    console.log('\n3️⃣ Fetching user rental requests...');
    const requestsResponse = await api.get('/my-requests');
    
    if (requestsResponse.status === 200) {
      const requests = requestsResponse.data.rentalRequests || [];
      console.log('✅ Fetched rental requests successfully');
      console.log('📋 Total requests:', requests.length);
      
      if (requests.length > 0) {
        console.log('📋 Latest request:', {
          id: requests[0].id,
          title: requests[0].title,
          location: requests[0].location,
          budget: requests[0].budget,
          status: requests[0].status
        });
      }
    } else {
      console.log('❌ Failed to fetch rental requests:', requestsResponse.data);
    }

    console.log('\n🎉 Rental request test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Run the test
testRentalRequest(); 