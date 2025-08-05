import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

// Sample tenant data
const tenantData = {
  name: 'Anna Kowalski',
  email: 'tenant@test.com',
  password: 'tenant123',
  role: 'TENANT'
};

// Sample landlord data
const landlordData = {
  name: 'Jan Nowak',
  email: 'landlord@test.com',
  password: 'landlord123',
  role: 'LANDLORD'
};

// Sample property data
const propertyData = {
  title: 'Beautiful Apartment in Poznań',
  description: 'Modern 2-bedroom apartment in city center',
  address: 'ul. Poznańska 125',
  city: 'Poznań',
  district: 'Centrum',
  monthlyRent: 3200,
  bedrooms: 2,
  bathrooms: 1,
  availableFrom: new Date('2024-09-01'),
  propertyType: 'APARTMENT'
};

// Sample rental request data
const rentalRequestData = {
  title: 'Looking for 2-bedroom apartment in Poznań',
  description: 'Clean, responsible tenant looking for long-term rental. Non-smoker, no pets.',
  location: 'Poznań',
  budgetFrom: 2000,
  budgetTo: 3500,
  preferredMoveIn: new Date('2024-09-15'),
  bedrooms: 2,
  propertyType: 'APARTMENT'
};

async function createSampleData() {
  try {
    console.log('🧪 Creating sample data for landlord dashboard...');

    // 1. Create tenant
    console.log('👤 Creating tenant...');
    const tenantResponse = await axios.post(`${API_BASE}/auth/register`, tenantData);
    const tenant = tenantResponse.data.user;
    console.log('✅ Tenant created:', tenant.email);

    // 2. Create landlord
    console.log('🏠 Creating landlord...');
    const landlordResponse = await axios.post(`${API_BASE}/auth/register`, landlordData);
    const landlord = landlordResponse.data.user;
    console.log('✅ Landlord created:', landlord.email);

    // 3. Login as landlord to get token
    console.log('🔑 Logging in as landlord...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: landlordData.email,
      password: landlordData.password
    });
    const token = loginResponse.data.token;
    console.log('✅ Landlord logged in');

    // 4. Create property for landlord
    console.log('🏢 Creating property...');
    const propertyResponse = await axios.post(`${API_BASE}/properties`, propertyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const property = propertyResponse.data.property;
    console.log('✅ Property created:', property.title);

    // 5. Login as tenant to get token
    console.log('🔑 Logging in as tenant...');
    const tenantLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: tenantData.email,
      password: tenantData.password
    });
    const tenantToken = tenantLoginResponse.data.token;
    console.log('✅ Tenant logged in');

    // 6. Create rental request
    console.log('📝 Creating rental request...');
    const requestResponse = await axios.post(`${API_BASE}/rental-request`, rentalRequestData, {
      headers: { Authorization: `Bearer ${tenantToken}` }
    });
    const rentalRequest = requestResponse.data.rentalRequest;
    console.log('✅ Rental request created:', rentalRequest.title);

    // 7. Wait a moment for the matching system to process
    console.log('⏳ Waiting for matching system to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 8. Check if landlord sees the request
    console.log('👀 Checking landlord requests...');
    const requestsResponse = await axios.get(`${API_BASE}/rental-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📊 Landlord requests:', {
      count: requestsResponse.data.rentalRequests?.length || 0,
      requests: requestsResponse.data.rentalRequests || []
    });

    if (requestsResponse.data.rentalRequests?.length > 0) {
      console.log('🎉 SUCCESS! Landlord can see rental requests!');
      console.log('💡 Now you can log in as landlord and see the beautiful rental request cards!');
    } else {
      console.log('⚠️  No requests found for landlord. This might be due to:');
      console.log('   - Matching system not working properly');
      console.log('   - Property and request criteria not matching');
      console.log('   - Database issues');
    }

    console.log('\n🔗 Login Credentials:');
    console.log('Landlord: landlord@test.com / landlord123');
    console.log('Tenant: tenant@test.com / tenant123');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData(); 