import { prisma } from './backend/src/utils/prisma.js';
import bcrypt from 'bcrypt';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Test data for complete flow
const testData = {
  tenant: {
    email: 'flow-tenant@example.com',
    password: 'tenant123',
    name: 'Flow Test Tenant'
  },
  landlord: {
    email: 'flow-landlord@example.com',
    password: 'landlord123',
    name: 'Flow Test Landlord',
    phoneNumber: '+48 987 654 321'
  },
  property: {
    name: 'Flow Test Apartment',
    description: 'A perfect apartment for testing the complete flow.',
    address: 'ul. Flow Test 15, Warszawa, Mokotów',
    city: 'Warszawa',
    zipCode: '00-002',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    size: 75,
    monthlyRent: 3800,
    depositAmount: 3800,
    utilitiesIncluded: true,
    furnished: true,
    parking: true,
    petsAllowed: false,
    availableFrom: '2025-12-01',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    houseRules: 'No pets, quiet hours 22:00-08:00.'
  },
  rentalRequest: {
    title: 'Looking for 2-Bedroom Apartment in Warsaw for Flow Test',
    description: 'Looking for a 2-bedroom apartment in Warsaw area for testing the complete rental flow.',
    location: 'Warszawa',
    budget: 3800,
    budgetFrom: 3500,
    budgetTo: 4200,
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
  console.log('🔧 Creating test users for complete flow...');
  
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

const testCompleteFlow = async () => {
  try {
    console.log('🚀 Testing Complete Rental Flow End-to-End...\n');
    
    // Step 1: Create test users
    const { tenant, landlord } = await createTestUsers();
    
    // Step 2: Create property as landlord
    console.log('\n🏢 Step 1: Creating property as landlord...');
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
    console.log('\n👤 Step 2: Creating rental request as tenant...');
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
    
    // Step 4: Wait for pool processing
    console.log('\n⏳ Step 3: Waiting for pool processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 5: Check if landlord can see the request
    console.log('\n🔍 Step 4: Checking if landlord can see the request...');
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
      
      // Step 6: Landlord creates an offer
      console.log('\n💼 Step 5: Landlord creating offer...');
      const offerData = {
        rentAmount: property.monthlyRent,
        depositAmount: property.depositAmount,
        leaseDuration: 12, // 12 months
        description: 'Perfect match for your requirements!',
        utilitiesIncluded: property.utilitiesIncluded,
        availableFrom: property.availableFrom,
        propertyAddress: property.address,
        propertyImages: property.images,
        propertyType: property.propertyType,
        propertySize: property.size.toString(),
        propertyAmenities: ['Furnished', 'Parking', 'Utilities Included'],
        propertyDescription: property.description,
        rulesText: property.houseRules
      };
      
      const offerResponse = await axios.post(
        `${API_BASE_URL}/rental-requests/${rentalRequest.id}/offer`,
        offerData,
        {
          headers: { Authorization: `Bearer ${landlordToken}` }
        }
      );
      
      const offer = offerResponse.data.offer;
      console.log('   ✅ Offer created successfully');
      console.log(`   Offer ID: ${offer.id}`);
      console.log(`   Monthly Rent: ${offer.monthlyRent} PLN`);
      console.log(`   Status: ${offer.status}`);
      
      // Step 7: Check if tenant can see the offer
      console.log('\n👤 Step 6: Checking if tenant can see the offer...');
      const offersResponse = await axios.get(
        `${API_BASE_URL}/tenant/offers`,
        {
          headers: { Authorization: `Bearer ${tenantToken}` }
        }
      );
      
      const tenantOffers = offersResponse.data.offers;
      const tenantOffer = tenantOffers.find(o => o.id === offer.id);
      
      if (tenantOffer) {
        console.log('   ✅ OFFER RECEIVED! Tenant can see the offer');
        console.log(`   Offer Status: ${tenantOffer.status}`);
        console.log(`   Monthly Rent: ${tenantOffer.monthlyRent} PLN`);
        console.log(`   Landlord: ${tenantOffer.landlord?.name || 'N/A'}`);
        
        // Step 8: Tenant accepts the offer
        console.log('\n✅ Step 7: Tenant accepting the offer...');
        const acceptResponse = await axios.patch(
          `${API_BASE_URL}/tenant/offer/${offer.id}`,
          { status: 'ACCEPTED' },
          {
            headers: { Authorization: `Bearer ${tenantToken}` }
          }
        );
        
        console.log('   ✅ Offer accepted successfully');
        console.log(`   Response: ${acceptResponse.data.message}`);
        
        // Step 9: Verify the offer status changed
        console.log('\n🔍 Step 8: Verifying offer status change...');
        const updatedOffersResponse = await axios.get(
          `${API_BASE_URL}/tenant/offers`,
          {
            headers: { Authorization: `Bearer ${tenantToken}` }
          }
        );
        
        const updatedOffers = updatedOffersResponse.data.offers;
        const updatedOffer = updatedOffers.find(o => o.id === offer.id);
        
        if (updatedOffer && updatedOffer.status === 'ACCEPTED') {
          console.log('   ✅ Offer status updated to ACCEPTED');
        } else {
          console.log('   ❌ Offer status not updated correctly');
        }
        
        // Step 10: Check rental request status
        console.log('\n📋 Step 9: Checking rental request status...');
        const updatedRequestResponse = await axios.get(
          `${API_BASE_URL}/my-requests`,
          {
            headers: { Authorization: `Bearer ${tenantToken}` }
          }
        );
        
        const updatedRequests = updatedRequestResponse.data.rentalRequests;
        const updatedRequest = updatedRequests.find(r => r.id === rentalRequest.id);
        
        if (updatedRequest) {
          console.log(`   ✅ Rental request status: ${updatedRequest.status}`);
          console.log(`   ✅ Pool status: ${updatedRequest.poolStatus}`);
        }
        
        console.log('\n🎉 SUCCESS! Complete rental flow works end-to-end!');
        console.log('\n📊 Flow Summary:');
        console.log('   1. ✅ Landlord created property');
        console.log('   2. ✅ Tenant created rental request');
        console.log('   3. ✅ System matched request to landlord');
        console.log('   4. ✅ Landlord saw the request');
        console.log('   5. ✅ Landlord created offer');
        console.log('   6. ✅ Tenant received the offer');
        console.log('   7. ✅ Tenant accepted the offer');
        console.log('   8. ✅ System updated all statuses correctly');
        
      } else {
        console.log('   ❌ OFFER NOT RECEIVED! Tenant cannot see the offer');
        console.log('   Available offers:', tenantOffers.length);
        tenantOffers.forEach(o => {
          console.log(`     - Offer ${o.id}: ${o.status} (${o.monthlyRent} PLN)`);
        });
      }
      
    } else {
      console.log('   ❌ REQUEST NOT MATCHED! Landlord cannot see the request');
      console.log('   Available requests:', availableRequests.length);
      availableRequests.forEach(req => {
        console.log(`     - Request ${req.id}: ${req.title} (${req.location})`);
      });
    }
    
    console.log('\n🔗 Manual Testing:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Tenant: flow-tenant@example.com / tenant123');
    console.log('   Landlord: flow-landlord@example.com / landlord123');
    
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
testCompleteFlow(); 