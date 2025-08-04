import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Test landlord credentials
const landlordCredentials = {
  email: 'landlord@test.com',
  password: 'password123'
};

let authToken = '';

// Login function
const login = async () => {
  try {
    console.log('🔐 Attempting to login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, landlordCredentials);
    console.log('Response:', response.data);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
};

// Create a simple test property
const createTestProperty = async () => {
  const testProperty = {
    name: 'Modern Apartment in Warsaw',
    address: 'ul. Marszałkowska 123',
    city: 'Warsaw',
    zipCode: '00-001',
    country: 'Poland',
    propertyType: 'APARTMENT',
    bedrooms: 2,
    bathrooms: 1,
    size: 65,
    floor: 3,
    totalFloors: 8,
    monthlyRent: 2500,
    depositAmount: 2500,
    utilitiesIncluded: true,
    availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    furnished: true,
    parking: true,
    petsAllowed: false,
    smokingAllowed: false,
    maxTenants: 2,
    description: 'Beautiful modern apartment in the heart of Warsaw with great amenities.',
    houseRules: 'No smoking, no pets, quiet hours 22:00-07:00',
    status: 'AVAILABLE'
  };

  try {
    console.log('🏠 Creating test property...');
    const response = await axios.post(`${API_BASE_URL}/properties`, testProperty, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Created property:', response.data.property.name);
      return response.data.property;
    } else {
      console.log('❌ Failed to create property:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating property:', error.response?.data || error.message);
    return null;
  }
};

// Get properties
const getProperties = async () => {
  try {
    console.log('📋 Fetching properties...');
    const response = await axios.get(`${API_BASE_URL}/landlord-properties`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Properties fetched successfully');
      console.log('Number of properties:', response.data.properties.length);
      response.data.properties.forEach(prop => {
        console.log(`- ${prop.name} (${prop.city})`);
      });
      return response.data.properties;
    } else {
      console.log('❌ Failed to fetch properties:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching properties:', error.response?.data || error.message);
    return [];
  }
};

// Main test function
const runTest = async () => {
  console.log('🚀 Starting login and property test...\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }

  console.log('\n---\n');

  // Step 2: Get existing properties
  const existingProperties = await getProperties();
  
  console.log('\n---\n');

  // Step 3: Create a test property if none exist
  if (existingProperties.length === 0) {
    console.log('📝 No properties found, creating a test property...');
    await createTestProperty();
    
    console.log('\n---\n');
    
    // Step 4: Get properties again
    await getProperties();
  } else {
    console.log('✅ Properties already exist in the database');
  }

  console.log('\n🎉 Test completed!');
};

runTest().catch(console.error); 