import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

// Test data with explicit budget fields
const testData = {
  tenant: {
    email: 'debug-tenant@example.com',
    password: 'password123',
    name: 'Debug Tenant',
    role: 'TENANT'
  },
  rentalRequest: {
    title: 'Debug Budget Test',
    description: 'Testing budget fields',
    location: 'Warsaw, Poland',
    moveInDate: '2025-09-01',
    budget: 2500,
    budgetFrom: 2000,
    budgetTo: 3000,
    bedrooms: 2,
    bathrooms: 1,
    furnished: true,
    parking: false,
    petsAllowed: true
  }
};

async function debugBudgetFields() {
  console.log('🔍 Debugging Budget Fields');
  console.log('==========================');
  
  try {
    // Step 1: Create/Load tenant
    console.log('👤 Creating tenant...');
    let tenantData;
    try {
      console.log('📡 Making registration request...');
      tenantData = await axios.post(`${API_BASE}/auth/register`, testData.tenant);
      console.log('✅ Tenant created successfully');
    } catch (error) {
      console.log('⚠️ Registration failed, trying login...');
      console.log('Error details:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      
      if (error.response?.status === 409) {
        console.log('⚠️ Tenant already exists, logging in...');
        tenantData = await axios.post(`${API_BASE}/auth/login`, {
          email: testData.tenant.email,
          password: testData.tenant.password
        });
      } else {
        throw error;
      }
    }
    
    const tenantToken = tenantData.data.token;
    console.log(`👤 Tenant ID: ${tenantData.data.user.id}`);
    
    // Step 2: Create rental request with explicit budget fields
    console.log('📝 Creating rental request...');
    console.log('📝 Request data:', JSON.stringify(testData.rentalRequest, null, 2));
    
    const response = await axios.post(`${API_BASE}/rental-request`, testData.rentalRequest, {
      headers: { Authorization: `Bearer ${tenantToken}` }
    });
    
    console.log('✅ Rental request created successfully');
    console.log('📝 Response data:', JSON.stringify(response.data, null, 2));
    
    const rentalRequest = response.data.rentalRequest;
    console.log(`📝 Rental Request ID: ${rentalRequest.id}`);
    console.log(`   Title: ${rentalRequest.title}`);
    console.log(`   Location: ${rentalRequest.location}`);
    console.log(`   Budget: ${rentalRequest.budget}`);
    console.log(`   Budget From: ${rentalRequest.budgetFrom}`);
    console.log(`   Budget To: ${rentalRequest.budgetTo}`);
    console.log(`   Bedrooms: ${rentalRequest.bedrooms}`);
    console.log(`   Move-in: ${rentalRequest.moveInDate}`);
    
    // Step 3: Check if budget fields are saved
    if (rentalRequest.budgetFrom === null || rentalRequest.budgetTo === null) {
      console.log('❌ Budget fields are still null in response');
      console.log('🔍 This indicates the backend is not saving these fields');
    } else {
      console.log('✅ Budget fields are saved correctly');
      console.log(`   Budget From: ${rentalRequest.budgetFrom}`);
      console.log(`   Budget To: ${rentalRequest.budgetTo}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error.message);
    }
  }
}

debugBudgetFields(); 