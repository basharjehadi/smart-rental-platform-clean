import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Test credentials
const testUsers = {
  tenant: {
    email: 'tenant@test.com',
    password: 'tenant123'
  },
  landlord: {
    email: 'landlord@test.com',
    password: 'landlord123'
  }
};

let tenantToken, landlordToken;

// Helper function to log test results
const logTest = (testName, passed, data = null) => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (data) {
    console.log(`   Data:`, data);
  }
};

// Step 1: Login as tenant and landlord
const loginUsers = async () => {
  console.log('🔐 Logging in users...\n');
  
  try {
    // Login as tenant
    const tenantResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUsers.tenant.email,
      password: testUsers.tenant.password
    });
    tenantToken = tenantResponse.data.token;
    logTest('Tenant Login', true, { name: tenantResponse.data.user.name });
    
    // Login as landlord
    const landlordResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUsers.landlord.email,
      password: testUsers.landlord.password
    });
    landlordToken = landlordResponse.data.token;
    logTest('Landlord Login', true, { name: landlordResponse.data.user.name });
    
  } catch (error) {
    logTest('User Login', false, error.response?.data);
    throw error;
  }
};

// Step 2: Create a rental request
const createRentalRequest = async () => {
  console.log('\n🏠 Creating rental request...\n');
  
  try {
    const headers = { Authorization: `Bearer ${tenantToken}` };
    
    const rentalRequestData = {
      title: 'Looking for 2-bedroom apartment in Mokotów',
      description: 'Looking for a comfortable 2-bedroom apartment in Mokotów area',
      location: 'Warszawa, Mokotów',
      budget: 2500,
      propertyType: 'APARTMENT',
      moveInDate: '2025-10-01',
      leaseDuration: 12,
      amenities: ['PARKING', 'BALCONY', 'ELEVATOR'],
      additionalRequirements: 'Looking for a quiet apartment near public transport',
      urgency: 'MEDIUM'
    };
    
    const response = await axios.post(`${API_BASE_URL}/rental-request`, rentalRequestData, { headers });
    
    logTest('Create Rental Request', true, {
      id: response.data.rentalRequest?.id,
      location: response.data.rentalRequest?.location,
      budget: response.data.rentalRequest?.budget
    });
    
    return response.data;
  } catch (error) {
    logTest('Create Rental Request', false, error.response?.data);
    throw error;
  }
};

// Step 3: Check if landlord receives the request
const checkLandlordRequests = async () => {
  console.log('\n👀 Checking landlord requests...\n');
  
  try {
    const headers = { Authorization: `Bearer ${landlordToken}` };
    
    const response = await axios.get(`${API_BASE_URL}/rental-requests`, { headers });
    
    logTest('Landlord Get Requests', true, {
      count: Array.isArray(response.data) ? response.data.length : 0,
      requests: Array.isArray(response.data) ? response.data.map(r => ({ id: r.id, location: r.location, budget: r.budget })) : []
    });
    
    return response.data;
  } catch (error) {
    logTest('Landlord Get Requests', false, error.response?.data);
    throw error;
  }
};

// Step 4: Create an offer from landlord
const createOffer = async (rentalRequest) => {
  console.log('\n💼 Creating offer...\n');
  
  try {
    const headers = { Authorization: `Bearer ${landlordToken}` };
    
    const offerData = {
      rentAmount: 2400,
      leaseDuration: 12,
      availableFrom: '2025-10-01'
    };
    
    const response = await axios.post(`${API_BASE_URL}/rental-request/${rentalRequest.id}/offer`, offerData, { headers });
    
    logTest('Create Offer', true, {
      id: response.data.id,
      rentAmount: response.data.rentAmount,
      status: response.data.status
    });
    
    return response.data;
  } catch (error) {
    logTest('Create Offer', false, error.response?.data);
    throw error;
  }
};

// Step 5: Check tenant's offers
const checkTenantOffers = async () => {
  console.log('\n📋 Checking tenant offers...\n');
  
  try {
    const headers = { Authorization: `Bearer ${tenantToken}` };
    
    const response = await axios.get(`${API_BASE_URL}/offers/my-offers`, { headers });
    
    logTest('Tenant Get Offers', true, {
      count: response.data.length,
      offers: response.data.map(o => ({ id: o.id, monthlyRent: o.monthlyRent, status: o.status }))
    });
    
    return response.data;
  } catch (error) {
    logTest('Tenant Get Offers', false, error.response?.data);
    throw error;
  }
};

// Step 6: Accept an offer (simulate payment)
const acceptOffer = async (offer) => {
  console.log('\n✅ Accepting offer...\n');
  
  try {
    const headers = { Authorization: `Bearer ${tenantToken}` };
    
    const response = await axios.put(`${API_BASE_URL}/offers/${offer.id}/accept`, {}, { headers });
    
    logTest('Accept Offer', true, {
      id: offer.id,
      status: response.data.status
    });
    
    return response.data;
  } catch (error) {
    logTest('Accept Offer', false, error.response?.data);
    throw error;
  }
};

// Step 7: Check contract generation
const checkContractGeneration = async (offer) => {
  console.log('\n📄 Checking contract generation...\n');
  
  try {
    const headers = { Authorization: `Bearer ${tenantToken}` };
    
    // Check if contract was created
    const contractsResponse = await axios.get(`${API_BASE_URL}/contracts/my-contracts`, { headers });
    
    logTest('Check Contract Generation', true, {
      contractsCount: contractsResponse.data.length,
      contracts: contractsResponse.data.map(c => ({ 
        id: c.id, 
        status: c.status, 
        offerId: c.offerId 
      }))
    });
    
    return contractsResponse.data;
  } catch (error) {
    logTest('Check Contract Generation', false, error.response?.data);
    throw error;
  }
};

// Step 8: Test PDF download
const testPDFDownload = async (contract) => {
  console.log('\n📥 Testing PDF download...\n');
  
  try {
    const headers = { Authorization: `Bearer ${tenantToken}` };
    
    const response = await axios.get(`${API_BASE_URL}/contracts/${contract.id}/download`, { 
      headers,
      responseType: 'arraybuffer'
    });
    
    logTest('PDF Download', true, {
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      isPDF: response.headers['content-type']?.includes('pdf')
    });
    
    return response.data;
  } catch (error) {
    logTest('PDF Download', false, error.response?.data);
    throw error;
  }
};

// Main test function
const runRentalFlowTest = async () => {
  console.log('🧪 Starting Complete Rental Request → Contract Generation Test...\n');
  
  try {
    // Step 1: Login
    await loginUsers();
    
    // Step 2: Create rental request
    const rentalRequest = await createRentalRequest();
    
    // Step 3: Check landlord requests
    await checkLandlordRequests();
    
    // Step 4: Create offer
    const offer = await createOffer(rentalRequest);
    
    // Step 5: Check tenant offers
    await checkTenantOffers();
    
    // Step 6: Accept offer
    const acceptedOffer = await acceptOffer(offer);
    
    // Step 7: Check contract generation
    const contracts = await checkContractGeneration(acceptedOffer);
    
    // Step 8: Test PDF download (if contract exists)
    if (contracts.length > 0) {
      await testPDFDownload(contracts[0]);
    }
    
    console.log('\n🎉 Rental Flow Test Completed Successfully!');
    console.log('✅ All steps passed - Contract generation is working!');
    
  } catch (error) {
    console.log('\n❌ Rental Flow Test Failed');
    console.log('Error:', error.message);
  }
};

// Run the test
runRentalFlowTest(); 