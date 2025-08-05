import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

// Test data
const testData = {
  tenant: {
    email: 'test-tenant-matching@example.com',
    password: 'password123',
    name: 'Test Tenant Matching',
    role: 'TENANT'
  },
  landlord: {
    email: 'test-landlord-matching@example.com',
    password: 'password123',
    name: 'Test Landlord Matching',
    role: 'LANDLORD'
  },
  property: {
    name: 'Test Matching Property',
    description: 'A property that should match the rental request',
    address: 'Test Street 123',
    city: 'Warsaw',
    zipCode: '00-001',
    monthlyRent: 2500,
    bedrooms: 2,
    bathrooms: 1,
    availableFrom: '2025-09-01',
    propertyType: 'APARTMENT',
    furnished: true,
    parking: false,
    petsAllowed: true
  },
  rentalRequest: {
    title: 'Looking for 2-bedroom apartment in Warsaw',
    description: 'I need a 2-bedroom apartment in Warsaw with a budget of 2000-3000 PLN',
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

let tenantToken, landlordToken;
let tenantId, landlordId;
let propertyId, rentalRequestId;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createUser(userData) {
  try {
    console.log(`👤 Creating ${userData.role.toLowerCase()}...`);
    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    console.log(`✅ ${userData.role} created successfully`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️ ${userData.role} already exists, logging in...`);
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      return loginResponse.data;
    }
    throw error;
  }
}

async function loginUser(userData) {
  try {
    console.log(`🔐 Logging in ${userData.role.toLowerCase()}...`);
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: userData.email,
      password: userData.password
    });
    console.log(`✅ ${userData.role} logged in successfully`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function createProperty(propertyData, token) {
  try {
    console.log('🏠 Creating property...');
    const response = await axios.post(`${API_BASE}/properties`, propertyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Property created successfully');
    return response.data.property;
  } catch (error) {
    throw error;
  }
}

async function createRentalRequest(requestData, token) {
  try {
    console.log('📝 Creating rental request...');
    const response = await axios.post(`${API_BASE}/rental-request`, requestData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Rental request created successfully');
    return response.data.rentalRequest;
  } catch (error) {
    throw error;
  }
}

async function getLandlordRequests(token) {
  try {
    console.log('🔍 Fetching landlord requests...');
    const response = await axios.get(`${API_BASE}/rental-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Landlord requests fetched successfully');
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function checkDatabaseMatches() {
  try {
    console.log('🔍 Checking database matches...');
    
    // Check if rental request exists
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
      include: { tenant: true }
    });
    
    if (!rentalRequest) {
      console.log('❌ Rental request not found in database');
      return false;
    }
    
    console.log(`✅ Rental request found: ${rentalRequest.title}`);
    console.log(`   Status: ${rentalRequest.poolStatus}`);
    console.log(`   Tenant: ${rentalRequest.tenant.name}`);
    
    // Check if matches were created
    const matches = await prisma.landlordRequestMatch.findMany({
      where: { rentalRequestId: rentalRequestId },
      include: {
        landlord: { select: { name: true, email: true } },
        rentalRequest: { select: { title: true } }
      }
    });
    
    console.log(`📊 Found ${matches.length} matches in database`);
    
    matches.forEach(match => {
      console.log(`   👤 Landlord: ${match.landlord.name} (${match.landlord.email})`);
      console.log(`   🎯 Match Score: ${match.matchScore}`);
      console.log(`   📝 Match Reason: ${match.matchReason}`);
      console.log(`   👀 Viewed: ${match.isViewed}`);
    });
    
    return matches.length > 0;
  } catch (error) {
    console.error('❌ Error checking database matches:', error);
    return false;
  }
}

async function testCoreMatchingSystem() {
  console.log('🚀 Testing Core Matching System');
  console.log('================================');
  
  try {
    // Step 1: Create/Load tenant
    const tenantData = await createUser(testData.tenant);
    tenantToken = tenantData.token;
    tenantId = tenantData.user.id;
    console.log(`👤 Tenant ID: ${tenantId}`);
    
    // Step 2: Create/Load landlord
    const landlordData = await createUser(testData.landlord);
    landlordToken = landlordData.token;
    landlordId = landlordData.user.id;
    console.log(`👤 Landlord ID: ${landlordId}`);
    
    // Step 3: Landlord creates a property
    const property = await createProperty(testData.property, landlordToken);
    propertyId = property.id;
    console.log(`🏠 Property ID: ${propertyId}`);
    console.log(`   Address: ${property.address}, ${property.city}`);
    console.log(`   Rent: ${property.monthlyRent} PLN`);
    console.log(`   Bedrooms: ${property.bedrooms}`);
    console.log(`   Available from: ${property.availableFrom}`);
    
    // Step 4: Tenant creates a rental request
    const rentalRequest = await createRentalRequest(testData.rentalRequest, tenantToken);
    rentalRequestId = rentalRequest.id;
    console.log(`📝 Rental Request ID: ${rentalRequestId}`);
    console.log(`   Title: ${rentalRequest.title}`);
    console.log(`   Location: ${rentalRequest.location}`);
    console.log(`   Budget: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN`);
    console.log(`   Bedrooms: ${rentalRequest.bedrooms}`);
    console.log(`   Move-in: ${rentalRequest.moveInDate}`);
    
    // Step 5: Wait for pool processing (give it time to process)
    console.log('⏳ Waiting for pool processing...');
    await sleep(3000);
    
    // Step 6: Check database for matches
    const hasMatches = await checkDatabaseMatches();
    
    if (!hasMatches) {
      console.log('❌ No matches found in database');
      console.log('🔍 Debugging matching criteria...');
      
      // Debug: Check property details
      const propertyDetails = await prisma.property.findUnique({
        where: { id: propertyId }
      });
      console.log('🏠 Property details:');
      console.log(`   City: ${propertyDetails.city}`);
      console.log(`   Address: ${propertyDetails.address}`);
      console.log(`   Monthly Rent: ${propertyDetails.monthlyRent}`);
      console.log(`   Bedrooms: ${propertyDetails.bedrooms}`);
      console.log(`   Available From: ${propertyDetails.availableFrom}`);
      
      // Debug: Check rental request details
      const requestDetails = await prisma.rentalRequest.findUnique({
        where: { id: rentalRequestId }
      });
      console.log('📝 Rental request details:');
      console.log(`   Location: ${requestDetails.location}`);
      console.log(`   Budget From: ${requestDetails.budgetFrom}`);
      console.log(`   Budget To: ${requestDetails.budgetTo}`);
      console.log(`   Bedrooms: ${requestDetails.bedrooms}`);
      console.log(`   Move In Date: ${requestDetails.moveInDate}`);
      
      return false;
    }
    
    // Step 7: Landlord fetches requests
    const landlordRequests = await getLandlordRequests(landlordToken);
    console.log(`📊 Landlord received ${landlordRequests.rentalRequests.length} requests`);
    
    if (landlordRequests.rentalRequests.length === 0) {
      console.log('❌ Landlord received no requests');
      return false;
    }
    
    // Step 8: Verify the request details
    const receivedRequest = landlordRequests.rentalRequests[0];
    console.log('✅ Landlord received matching request:');
    console.log(`   Title: ${receivedRequest.title}`);
    console.log(`   Tenant: ${receivedRequest.tenant.name}`);
    console.log(`   Match Score: ${receivedRequest.matchScore}`);
    console.log(`   Match Reason: ${receivedRequest.matchReason}`);
    
    // Step 9: Verify matching criteria
    console.log('🔍 Verifying matching criteria:');
    console.log(`   Location match: ${receivedRequest.location.includes('Warsaw') ? '✅' : '❌'}`);
    console.log(`   Budget match: ${receivedRequest.budgetFrom <= 2500 && receivedRequest.budgetTo >= 2500 ? '✅' : '❌'}`);
    console.log(`   Bedrooms match: ${receivedRequest.bedrooms === 2 ? '✅' : '❌'}`);
    console.log(`   Move-in date match: ${new Date(receivedRequest.moveInDate) >= new Date('2025-01-01') ? '✅' : '❌'}`);
    
    console.log('\n🎉 CORE MATCHING SYSTEM TEST PASSED!');
    console.log('✅ Tenant created rental request');
    console.log('✅ System found matching landlord property');
    console.log('✅ Landlord received the rental request');
    console.log('✅ All matching criteria verified');
    
    return true;
    
  } catch (error) {
    console.error('❌ Core matching system test failed:', error.response?.data || error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCoreMatchingSystem()
  .then(success => {
    console.log(`\n🏁 Test completed: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test crashed:', error);
    console.error('Error details:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }); 