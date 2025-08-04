import { prisma } from './backend/src/utils/prisma.js';
import bcrypt from 'bcrypt';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Test data
const testData = {
  tenant: {
    email: 'basic-test-tenant@example.com',
    password: 'tenant123',
    name: 'Basic Test Tenant'
  },
  landlord: {
    email: 'basic-test-landlord@example.com',
    password: 'landlord123',
    name: 'Basic Test Landlord',
    phoneNumber: '+48 123 456 789'
  },
  property: {
    name: 'Test Apartment in Warsaw',
    description: 'A simple test apartment for verification.',
    address: 'ul. Testowa 1, Warszawa',
    city: 'Warszawa',
    zipCode: '00-001',
    propertyType: 'Apartment',
    bedrooms: 1,
    bathrooms: 1,
    size: 50,
    monthlyRent: 2500,
    depositAmount: 2500,
    utilitiesIncluded: true,
    furnished: false,
    parking: false,
    petsAllowed: false,
    availableFrom: '2025-12-01',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    houseRules: 'Standard rules apply.'
  },
  rentalRequest: {
    title: 'Looking for 1-Bedroom Apartment',
    description: 'Looking for a simple 1-bedroom apartment in Warsaw.',
    location: 'Warszawa',
    budget: 2500,
    budgetFrom: 2000,
    budgetTo: 3000,
    bedrooms: 1,
    moveInDate: '2025-12-01'
  }
};

// Helper functions
const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
};

const createTestUsers = async () => {
  console.log('🔧 Creating test users...');
  
  // Create tenant
  const tenant = await prisma.user.upsert({
    where: { email: testData.tenant.email },
    update: {},
    create: {
      email: testData.tenant.email,
      name: testData.tenant.name,
      password: await bcrypt.hash(testData.tenant.password, 10),
      role: 'TENANT'
    }
  });

  // Create landlord
  const landlord = await prisma.user.upsert({
    where: { email: testData.landlord.email },
    update: {},
    create: {
      email: testData.landlord.email,
      name: testData.landlord.name,
      password: await bcrypt.hash(testData.landlord.password, 10),
      role: 'LANDLORD',
      phoneNumber: testData.landlord.phoneNumber
    }
  });

  console.log('✅ Test users created/verified');
  return { tenant, landlord };
};

const testBasicFunctionality = async () => {
  try {
    console.log('🚀 Testing Basic Functionality...\n');
    
    // Step 1: Create test users
    const { tenant, landlord } = await createTestUsers();
    
    // Step 2: Test Tenant Rental Request
    console.log('👤 Testing Tenant Rental Request Creation');
    console.log('   Logging in as tenant...');
    const tenantToken = await loginUser(testData.tenant.email, testData.tenant.password);
    console.log('   ✅ Tenant logged in successfully');
    
    console.log('   Creating rental request...');
    const rentalRequestResponse = await axios.post(
      `${API_BASE_URL}/rental-request`,
      testData.rentalRequest,
      {
        headers: { Authorization: `Bearer ${tenantToken}` }
      }
    );
    
    const rentalRequest = rentalRequestResponse.data.rentalRequest;
    console.log('   ✅ Rental request created successfully');
    console.log('      Request ID:', rentalRequest.id);
    console.log('      Title:', rentalRequest.title);
    console.log('      Location:', rentalRequest.location);
    console.log('      Budget:', rentalRequest.budget, 'PLN');
    console.log('      Status:', rentalRequest.status);
    
    // Step 3: Test Landlord Property Listing
    console.log('\n🏢 Testing Landlord Property Listing Creation');
    console.log('   Logging in as landlord...');
    const landlordToken = await loginUser(testData.landlord.email, testData.landlord.password);
    console.log('   ✅ Landlord logged in successfully');
    
    console.log('   Creating property listing...');
    const propertyResponse = await axios.post(
      `${API_BASE_URL}/properties/properties`,
      testData.property,
      {
        headers: { Authorization: `Bearer ${landlordToken}` }
      }
    );
    
    const property = propertyResponse.data.property;
    console.log('   ✅ Property listing created successfully');
    console.log('      Property ID:', property.id);
    console.log('      Name:', property.name);
    console.log('      Address:', property.address);
    console.log('      Monthly Rent:', property.monthlyRent, 'PLN');
    console.log('      Bedrooms:', property.bedrooms);
    console.log('      Property Type:', property.propertyType);
    
    // Step 4: Verify data in database
    console.log('\n🔍 Verifying Data in Database');
    
    // Check rental request
    const dbRentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequest.id },
      include: { tenant: true }
    });
    console.log('   ✅ Rental request found in database');
    console.log('      Tenant:', dbRentalRequest.tenant.name);
    console.log('      Created:', dbRentalRequest.createdAt);
    
    // Check property
    const dbProperty = await prisma.property.findUnique({
      where: { id: property.id },
      include: { landlord: true }
    });
    console.log('   ✅ Property found in database');
    console.log('      Landlord:', dbProperty.landlord.name);
    console.log('      Created:', dbProperty.createdAt);
    
    // Test Results Summary
    console.log('\n🎉 BASIC FUNCTIONALITY TEST RESULTS:');
    console.log('====================================');
    console.log('✅ Tenant can create rental requests');
    console.log('✅ Landlord can create property listings');
    console.log('✅ Data is properly saved in database');
    console.log('✅ Authentication works for both user types');
    
    console.log('\n📊 Test Data Summary:');
    console.log('   Tenant:', testData.tenant.name, '(', testData.tenant.email, ')');
    console.log('   Landlord:', testData.landlord.name, '(', testData.landlord.email, ')');
    console.log('   Rental Request ID:', rentalRequest.id);
    console.log('   Property ID:', property.id);
    
    console.log('\n🔗 Manual Testing:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Tenant Login:', testData.tenant.email, '/', testData.tenant.password);
    console.log('   Landlord Login:', testData.landlord.email, '/', testData.landlord.password);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Status:', error.response.status);
    }
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testBasicFunctionality(); 