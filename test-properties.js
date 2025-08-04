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
    const response = await axios.post(`${API_BASE_URL}/auth/login`, landlordCredentials);
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);
    return false;
  }
};

// Create sample properties
const createSampleProperties = async () => {
  const sampleProperties = [
    {
      name: 'Modern Apartment in Warsaw',
      address: 'ul. Marszałkowska 123',
      city: 'Warsaw',
      zipCode: '00-001',
      country: 'Poland',
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 1,
      size: 65,
      floor: 3,
      totalFloors: 8,
      monthlyRent: 2500,
      depositAmount: 2500,
      utilitiesIncluded: true,
      availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      furnished: true,
      parking: true,
      petsAllowed: false,
      smokingAllowed: false,
      maxTenants: 2,
      description: 'Beautiful modern apartment in the heart of Warsaw with great amenities.',
      houseRules: 'No smoking, no pets, quiet hours 22:00-07:00',
      status: 'AVAILABLE'
    },
    {
      name: 'Cozy Studio in Poznań',
      address: 'ul. Św. Marcin 45',
      city: 'Poznań',
      zipCode: '61-001',
      country: 'Poland',
      propertyType: 'studio',
      bedrooms: 0,
      bathrooms: 1,
      size: 35,
      floor: 2,
      totalFloors: 5,
      monthlyRent: 1800,
      depositAmount: 1800,
      utilitiesIncluded: false,
      availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      furnished: true,
      parking: false,
      petsAllowed: true,
      smokingAllowed: false,
      maxTenants: 1,
      description: 'Cozy studio apartment perfect for students or young professionals.',
      houseRules: 'No smoking, pets allowed with deposit',
      status: 'OCCUPIED'
    }
  ];

  for (const propertyData of sampleProperties) {
    try {
      const response = await axios.post(`${API_BASE_URL}/properties`, propertyData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log(`✅ Created property: ${propertyData.name}`);
      } else {
        console.log(`❌ Failed to create property: ${propertyData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating property ${propertyData.name}:`, error.response?.data?.error || error.message);
    }
  }
};

// Get all properties
const getProperties = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/landlord-properties`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('📋 Current properties:');
      response.data.properties.forEach(property => {
        console.log(`  - ${property.name} (${property.status}) - $${property.monthlyRent}/month`);
      });
      return response.data.properties;
    }
  } catch (error) {
    console.error('❌ Error fetching properties:', error.response?.data?.error || error.message);
    return [];
  }
};

// Delete a property
const deleteProperty = async (propertyId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/properties/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log(`✅ Deleted property with ID: ${propertyId}`);
      return true;
    } else {
      console.log(`❌ Failed to delete property with ID: ${propertyId}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting property ${propertyId}:`, error.response?.data?.error || error.message);
    return false;
  }
};

// Main test function
const runTest = async () => {
  console.log('🚀 Starting property management test...\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }

  // Step 2: Create sample properties
  console.log('\n📝 Creating sample properties...');
  await createSampleProperties();

  // Step 3: Get all properties
  console.log('\n📋 Fetching all properties...');
  const properties = await getProperties();

  if (properties.length > 0) {
    // Step 4: Delete the first property
    console.log('\n🗑️ Testing delete functionality...');
    const firstProperty = properties[0];
    await deleteProperty(firstProperty.id);

    // Step 5: Verify deletion
    console.log('\n📋 Verifying deletion...');
    await getProperties();
  }

  console.log('\n✅ Property management test completed!');
};

// Run the test
runTest().catch(console.error); 