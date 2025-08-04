import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let authToken = '';

const testEnhancedMyRequests = async () => {
  try {
    console.log('🧪 Testing Enhanced My Requests Features...\n');

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

    // Step 2: Create a test rental request
    console.log('\n2️⃣ Creating a test rental request...');
    const testRequestData = {
      title: 'Looking for Apartment in Warsaw',
      description: 'Looking for a modern apartment in Warsaw with parking.',
      location: 'Mokotow, Warsaw',
      budget: 3500,
      moveInDate: '2024-12-15'
    };

    const createResponse = await api.post('/rental-request', testRequestData);
    if (createResponse.status === 201) {
      console.log('✅ Test rental request created successfully');
      const requestId = createResponse.data.rentalRequest.id;
      console.log('📋 Request ID:', requestId);
    } else {
      console.log('❌ Failed to create test request:', createResponse.data);
      return;
    }

    // Step 3: Fetch user's rental requests (should trigger auto-update)
    console.log('\n3️⃣ Fetching user rental requests (with auto-update)...');
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

    // Step 4: Test edit functionality (if we have a request)
    console.log('\n4️⃣ Testing edit functionality...');
    const requestsForEdit = await api.get('/my-requests');
    if (requestsForEdit.status === 200 && requestsForEdit.data.rentalRequests.length > 0) {
      const requestToEdit = requestsForEdit.data.rentalRequests[0];
      console.log('📋 Editing request ID:', requestToEdit.id);
      
      const updateData = {
        title: 'Updated: Looking for Apartment in Warsaw',
        description: 'Updated: Looking for a modern apartment in Warsaw with parking and balcony.',
        location: 'Mokotow, Warsaw',
        budget: 4000,
        moveInDate: '2024-12-20'
      };

      const updateResponse = await api.put(`/rental-request/${requestToEdit.id}`, updateData);
      if (updateResponse.status === 200) {
        console.log('✅ Request updated successfully');
        console.log('📋 Updated title:', updateResponse.data.rentalRequest.title);
        console.log('📋 Updated budget:', updateResponse.data.rentalRequest.budget);
      } else {
        console.log('❌ Failed to update request:', updateResponse.data);
      }
    }

    // Step 5: Test delete functionality (create a request to delete)
    console.log('\n5️⃣ Testing delete functionality...');
    const deleteRequestData = {
      title: 'Request to Delete',
      description: 'This request will be deleted for testing.',
      location: 'Test District, Warsaw',
      budget: 2000,
      moveInDate: '2024-12-25'
    };

    const createForDeleteResponse = await api.post('/rental-request', deleteRequestData);
    if (createForDeleteResponse.status === 201) {
      const requestToDelete = createForDeleteResponse.data.rentalRequest;
      console.log('📋 Created request for deletion, ID:', requestToDelete.id);

      const deleteResponse = await api.delete(`/rental-request/${requestToDelete.id}`);
      if (deleteResponse.status === 200) {
        console.log('✅ Request deleted successfully');
      } else {
        console.log('❌ Failed to delete request:', deleteResponse.data);
      }
    }

    console.log('\n🎉 Enhanced My Requests test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Run the test
testEnhancedMyRequests(); 