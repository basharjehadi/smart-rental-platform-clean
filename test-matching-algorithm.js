import { prisma } from './backend/src/utils/prisma.js';
import bcrypt from 'bcrypt';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Test data for matching scenarios
const testData = {
  // Scenario 1: Perfect Match
  perfectMatch: {
    tenant: {
      email: 'perfect-match-tenant@example.com',
      password: 'tenant123',
      name: 'Perfect Match Tenant'
    },
    landlord: {
      email: 'perfect-match-landlord@example.com',
      password: 'landlord123',
      name: 'Perfect Match Landlord',
      phoneNumber: '+48 123 456 789'
    },
    property: {
      name: 'Perfect Match Apartment',
      description: 'Perfect match for tenant requirements.',
      address: 'ul. Mokotowska 15, Warszawa, Mokotów',
      city: 'Warszawa',
      zipCode: '00-001',
      propertyType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      size: 75,
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
      title: 'Looking for 2-Bedroom Apartment in Mokotów',
      description: 'Looking for a 2-bedroom apartment in Mokotów area.',
      location: 'Warszawa, Mokotów',
      budget: 3500,
      budgetFrom: 3000,
      budgetTo: 4000,
      bedrooms: 2,
      moveInDate: '2025-12-01'
    }
  },
  
  // Scenario 2: Budget Mismatch
  budgetMismatch: {
    tenant: {
      email: 'budget-mismatch-tenant@example.com',
      password: 'tenant123',
      name: 'Budget Mismatch Tenant'
    },
    landlord: {
      email: 'budget-mismatch-landlord@example.com',
      password: 'landlord123',
      name: 'Budget Mismatch Landlord',
      phoneNumber: '+48 123 456 789'
    },
    property: {
      name: 'Expensive Apartment',
      description: 'Luxury apartment above tenant budget.',
      address: 'ul. Marszałkowska 50, Warszawa, Śródmieście',
      city: 'Warszawa',
      zipCode: '00-001',
      propertyType: 'Apartment',
      bedrooms: 1,
      bathrooms: 1,
      size: 60,
      monthlyRent: 6000, // Above tenant budget
      depositAmount: 6000,
      utilitiesIncluded: true,
      furnished: true,
      parking: false,
      petsAllowed: false,
      availableFrom: '2025-12-01',
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
      houseRules: 'No pets, no parking.'
    },
    rentalRequest: {
      title: 'Looking for 1-Bedroom Apartment',
      description: 'Looking for affordable 1-bedroom apartment.',
      location: 'Warszawa',
      budget: 3000,
      budgetFrom: 2500,
      budgetTo: 3500,
      bedrooms: 1,
      moveInDate: '2025-12-01'
    }
  },
  
  // Scenario 3: Location Mismatch
  locationMismatch: {
    tenant: {
      email: 'location-mismatch-tenant@example.com',
      password: 'tenant123',
      name: 'Location Mismatch Tenant'
    },
    landlord: {
      email: 'location-mismatch-landlord@example.com',
      password: 'landlord123',
      name: 'Location Mismatch Landlord',
      phoneNumber: '+48 123 456 789'
    },
    property: {
      name: 'Wrocław Apartment',
      description: 'Apartment in different city.',
      address: 'ul. Świdnicka 10, Wrocław',
      city: 'Wrocław', // Different city
      zipCode: '50-001',
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
      title: 'Looking for Apartment in Warsaw',
      description: 'Looking for apartment specifically in Warsaw.',
      location: 'Warszawa', // Different location
      budget: 3500,
      budgetFrom: 3000,
      budgetTo: 4000,
      bedrooms: 2,
      moveInDate: '2025-12-01'
    }
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

const createTestUsers = async (scenario) => {
  console.log(`🔧 Creating test users for ${scenario}...`);
  
  // Create tenant
  const tenant = await prisma.user.upsert({
    where: { email: testData[scenario].tenant.email },
    update: {},
    create: {
      email: testData[scenario].tenant.email,
      name: testData[scenario].tenant.name,
      password: await bcrypt.hash(testData[scenario].tenant.password, 10),
      role: 'TENANT'
    }
  });

  // Create landlord
  const landlord = await prisma.user.upsert({
    where: { email: testData[scenario].landlord.email },
    update: {},
    create: {
      email: testData[scenario].landlord.email,
      name: testData[scenario].landlord.name,
      password: await bcrypt.hash(testData[scenario].landlord.password, 10),
      role: 'LANDLORD',
      phoneNumber: testData[scenario].landlord.phoneNumber
    }
  });

  console.log(`✅ Test users created/verified for ${scenario}`);
  return { tenant, landlord };
};

const testMatchingScenario = async (scenarioName) => {
  try {
    console.log(`\n🎯 Testing ${scenarioName} Scenario`);
    console.log('=' .repeat(50));
    
    const scenario = testData[scenarioName];
    
    // Step 1: Create test users
    const { tenant, landlord } = await createTestUsers(scenarioName);
    
    // Step 2: Create property as landlord
    console.log('\n🏢 Creating property as landlord...');
    const landlordToken = await loginUser(scenario.landlord.email, scenario.landlord.password);
    
    const propertyResponse = await axios.post(
      `${API_BASE_URL}/properties/properties`,
      scenario.property,
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
    const tenantToken = await loginUser(scenario.tenant.email, scenario.tenant.password);
    
    const rentalRequestResponse = await axios.post(
      `${API_BASE_URL}/rental-request`,
      scenario.rentalRequest,
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
    
    // Step 4: Check if landlord can see the request (matching)
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
      
      // Analyze matching criteria
      console.log('\n📊 Matching Analysis:');
      console.log(`   Location Match: ${property.city} vs ${rentalRequest.location} - ${property.city.includes(rentalRequest.location.split(',')[0]) ? '✅' : '❌'}`);
      console.log(`   Budget Match: ${property.monthlyRent} PLN vs ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN - ${property.monthlyRent >= rentalRequest.budgetFrom && property.monthlyRent <= rentalRequest.budgetTo ? '✅' : '❌'}`);
      console.log(`   Bedrooms Match: ${property.bedrooms} vs ${rentalRequest.bedrooms} - ${property.bedrooms === rentalRequest.bedrooms ? '✅' : '❌'}`);
      
    } else {
      console.log('   ❌ REQUEST NOT MATCHED! Landlord cannot see the request');
      console.log('   This is expected for budget or location mismatches');
      
      // Analyze why it didn't match
      console.log('\n📊 Non-Matching Analysis:');
      console.log(`   Location: ${property.city} vs ${rentalRequest.location} - ${property.city.includes(rentalRequest.location.split(',')[0]) ? '✅' : '❌'}`);
      console.log(`   Budget: ${property.monthlyRent} PLN vs ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN - ${property.monthlyRent >= rentalRequest.budgetFrom && property.monthlyRent <= rentalRequest.budgetTo ? '✅' : '❌'}`);
      console.log(`   Bedrooms: ${property.bedrooms} vs ${rentalRequest.bedrooms} - ${property.bedrooms === rentalRequest.bedrooms ? '✅' : '❌'}`);
    }
    
    return { property, rentalRequest, matched: !!matchingRequest };
    
  } catch (error) {
    console.error(`❌ ${scenarioName} test failed:`, error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Status:', error.response.status);
    }
    return null;
  }
};

const testMatchingAlgorithm = async () => {
  try {
    console.log('🚀 Testing Smart Matching Algorithm...\n');
    
    const results = {};
    
    // Test all scenarios
    for (const scenarioName of Object.keys(testData)) {
      const result = await testMatchingScenario(scenarioName);
      results[scenarioName] = result;
    }
    
    // Summary
    console.log('\n🎉 MATCHING ALGORITHM TEST RESULTS:');
    console.log('=====================================');
    
    for (const [scenarioName, result] of Object.entries(results)) {
      if (result) {
        console.log(`${scenarioName}: ${result.matched ? '✅ MATCHED' : '❌ NOT MATCHED'}`);
        if (result.matched) {
          console.log(`   Property: ${result.property.name}`);
          console.log(`   Request: ${result.rentalRequest.title}`);
        }
      } else {
        console.log(`${scenarioName}: ❌ TEST FAILED`);
      }
    }
    
    console.log('\n📋 Expected Results:');
    console.log('   Perfect Match: ✅ Should match (location, budget, bedrooms all match)');
    console.log('   Budget Mismatch: ❌ Should not match (rent too high)');
    console.log('   Location Mismatch: ❌ Should not match (different city)');
    
    console.log('\n🔗 Manual Testing:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Perfect Match - Tenant: perfect-match-tenant@example.com / tenant123');
    console.log('   Perfect Match - Landlord: perfect-match-landlord@example.com / landlord123');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testMatchingAlgorithm(); 