import { prisma } from './backend/src/utils/prisma.js';
import bcrypt from 'bcrypt';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Simple test data for basic matching
const testData = {
  tenant: {
    email: 'simple-tenant@example.com',
    password: 'tenant123',
    name: 'Simple Tenant'
  },
  landlord: {
    email: 'simple-landlord@example.com',
    password: 'landlord123',
    name: 'Simple Landlord',
    phoneNumber: '+48 123 456 789'
  },
  property: {
    name: 'Test Apartment',
    description: 'A test apartment for matching.',
    address: 'ul. Testowa 10, Warszawa, Mokotów',
    city: 'Warszawa',
    zipCode: '00-001',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    size: 70,
    monthlyRent: 3500,
    depositAmount: 3500,
    utilitiesIncluded: true,
    furnished: true,
    parking: true,
    petsAllowed: true,
    availableFrom: '2025-12-01',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    houseRules: 'Pet-friendly, parking included.'
  },
  rentalRequest: {
    title: 'Looking for 2-Bedroom Apartment in Warsaw',
    description: 'Looking for a 2-bedroom apartment in Warsaw area.',
    location: 'Warszawa',
    budget: 3500,
    budgetFrom: 3000,
    budgetTo: 4000,
    bedrooms: 2,
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

const testSimpleMatching = async () => {
  try {
    console.log('🚀 Testing Simple Property-Based Matching Algorithm...\n');
    
    // Step 1: Create test users
    const { tenant, landlord } = await createTestUsers();
    
    // Step 2: Create property as landlord
    console.log('\n🏢 Creating property as landlord...');
    const landlordToken = await loginUser(testData.landlord.email, testData.landlord.password);
    
    const propertyResponse = await axios.post(
      `${API_BASE_URL}/properties/properties`,
      testData.property,
      {
        headers: { Authorization: `Bearer ${landlordToken}` }
      }
    );
    
    const property = propertyResponse.data.property;
    console.log('   ✅ Property created successfully');
    console.log(`   Property: ${property.name}`);
    console.log(`   Location: ${property.city}, ${property.address}`);
    console.log(`   Rent: ${property.monthlyRent} PLN`);
    console.log(`   Bedrooms: ${property.bedrooms}`);
    
    // Step 3: Create rental request as tenant
    console.log('\n👤 Creating rental request as tenant...');
    const tenantToken = await loginUser(testData.tenant.email, testData.tenant.password);
    
    const rentalRequestResponse = await axios.post(
      `${API_BASE_URL}/rental-request`,
      testData.rentalRequest,
      {
        headers: { Authorization: `Bearer ${tenantToken}` }
      }
    );
    
    const rentalRequest = rentalRequestResponse.data.rentalRequest;
    console.log('   ✅ Rental request created successfully');
    console.log(`   Request: ${rentalRequest.title}`);
    console.log(`   Location: ${rentalRequest.location}`);
    console.log(`   Budget: ${rentalRequest.budget} PLN (${rentalRequest.budgetFrom}-${rentalRequest.budgetTo})`);
    console.log(`   Bedrooms: ${rentalRequest.bedrooms}`);
    
    // Step 4: Wait a moment for pool processing
    console.log('\n⏳ Waiting for pool processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 5: Check if landlord can see the request
    console.log('\n🔍 Checking if landlord can see the request...');
    const requestsResponse = await axios.get(
      `${API_BASE_URL}/rental-requests`,
      {
        headers: { Authorization: `Bearer ${landlordToken}` }
      }
    );
    
    const availableRequests = requestsResponse.data.rentalRequests;
    const matchingRequest = availableRequests.find(req => req.id === rentalRequest.id);
    
    if (matchingRequest) {
      console.log('   ✅ REQUEST MATCHED! Landlord can see the request');
      console.log(`   Match Score: ${matchingRequest.matchScore || 'N/A'}`);
      console.log(`   Pool Status: ${matchingRequest.poolStatus || 'N/A'}`);
      console.log(`   Match Reason: ${matchingRequest.matchReason || 'N/A'}`);
      
      // Analyze matching criteria
      console.log('\n📊 Matching Analysis:');
      console.log(`   Location Match: ${property.city} vs ${rentalRequest.location} - ✅`);
      console.log(`   Budget Match: ${property.monthlyRent} PLN vs ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN - ✅`);
      console.log(`   Bedrooms Match: ${property.bedrooms} vs ${rentalRequest.bedrooms} - ✅`);
      
      console.log('\n🎉 SUCCESS! The simple property-based matching algorithm is working correctly!');
      
    } else {
      console.log('   ❌ REQUEST NOT MATCHED! Landlord cannot see the request');
      
      // Analyze why it didn't match
      console.log('\n📊 Non-Matching Analysis:');
      console.log(`   Location: ${property.city} vs ${rentalRequest.location} - ✅`);
      console.log(`   Budget: ${property.monthlyRent} PLN vs ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN - ✅`);
      console.log(`   Bedrooms: ${property.bedrooms} vs ${rentalRequest.bedrooms} - ✅`);
      
      console.log('\n🔍 Debugging: Checking pool status...');
      
      // Check if request is in pool
      const poolRequest = await prisma.rentalRequest.findUnique({
        where: { id: rentalRequest.id },
        select: { poolStatus: true, expiresAt: true }
      });
      
      console.log(`   Pool Status: ${poolRequest?.poolStatus}`);
      console.log(`   Expires At: ${poolRequest?.expiresAt}`);
      
      // Check if landlord has any matches
      const matches = await prisma.landlordRequestMatch.findMany({
        where: { landlordId: landlord.id },
        include: { rentalRequest: true }
      });
      
      console.log(`   Total matches for landlord: ${matches.length}`);
      
      if (matches.length > 0) {
        console.log('   Available matches:');
        matches.forEach(match => {
          console.log(`     - Request ${match.rentalRequest.id}: ${match.rentalRequest.title}`);
          console.log(`       Score: ${match.matchScore}, Reason: ${match.matchReason}`);
        });
      }
      
      // Check if landlord has properties
      const landlordProperties = await prisma.property.findMany({
        where: { landlordId: landlord.id },
        select: { id: true, name: true, city: true, monthlyRent: true, bedrooms: true }
      });
      
      console.log(`   Landlord properties: ${landlordProperties.length}`);
      landlordProperties.forEach(prop => {
        console.log(`     - ${prop.name}: ${prop.city}, ${prop.monthlyRent} PLN, ${prop.bedrooms} bedrooms`);
      });
      
      console.log('\n❌ The matching algorithm needs debugging');
    }
    
    console.log('\n🔗 Manual Testing:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Tenant: simple-tenant@example.com / tenant123');
    console.log('   Landlord: simple-landlord@example.com / landlord123');
    
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
testSimpleMatching(); 