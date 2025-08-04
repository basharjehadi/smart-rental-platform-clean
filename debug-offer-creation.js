import { prisma } from './backend/src/utils/prisma.js';
import bcrypt from 'bcrypt';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const debugOfferCreation = async () => {
  try {
    console.log('🔍 Debugging offer creation...');
    
    // Create a simple landlord and tenant
    const landlord = await prisma.user.upsert({
      where: { email: 'debug-landlord@example.com' },
      update: {},
      create: {
        email: 'debug-landlord@example.com',
        name: 'Debug Landlord',
        password: await bcrypt.hash('landlord123', 10),
        role: 'LANDLORD',
        availability: true,
        autoAvailability: true,
        maxTenants: 10,
        currentTenants: 0
      }
    });

    const tenant = await prisma.user.upsert({
      where: { email: 'debug-tenant@example.com' },
      update: {},
      create: {
        email: 'debug-tenant@example.com',
        name: 'Debug Tenant',
        password: await bcrypt.hash('tenant123', 10),
        role: 'TENANT'
      }
    });

    // Create a simple rental request
    const rentalRequest = await prisma.rentalRequest.create({
      data: {
        title: 'Debug Request',
        description: 'Debug rental request',
        location: 'Warszawa',
        budget: 3000,
        budgetFrom: 2500,
        budgetTo: 3500,
        bedrooms: 2,
        moveInDate: new Date('2025-12-01'),
        tenantId: tenant.id,
        poolStatus: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    console.log('✅ Created test data:');
    console.log(`   Landlord ID: ${landlord.id}`);
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Rental Request ID: ${rentalRequest.id}`);

    // Login as landlord
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'debug-landlord@example.com',
      password: 'landlord123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Try to create offer with minimal data
    const offerData = {
      rentAmount: 3000,
      leaseDuration: 12,
      availableFrom: '2025-12-01',
      description: 'Debug offer'
    };

    console.log('📤 Sending offer creation request...');
    console.log('   URL:', `${API_BASE_URL}/rental-request/${rentalRequest.id}/offer`);
    console.log('   Data:', offerData);

    const offerResponse = await axios.post(
      `${API_BASE_URL}/rental-request/${rentalRequest.id}/offer`,
      offerData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Offer created successfully!');
    console.log('   Offer ID:', offerResponse.data.offer.id);
    console.log('   Response:', offerResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
};

debugOfferCreation(); 