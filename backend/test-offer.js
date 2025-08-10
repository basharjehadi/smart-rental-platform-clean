import { prisma } from './src/utils/prisma.js';

async function testOfferCreation() {
  try {
    console.log('🔍 Testing offer creation...');
    
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test 2: Check if properties exist
    console.log('2. Checking properties...');
    const properties = await prisma.property.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        landlordId: true,
        status: true
      }
    });
    console.log('Properties found:', properties);
    
    // Test 3: Check if rental requests exist
    console.log('3. Checking rental requests...');
    const requests = await prisma.rentalRequest.findMany({
      take: 5,
      select: {
        id: true,
        status: true,
        poolStatus: true,
        tenantId: true
      }
    });
    console.log('Rental requests found:', requests);
    
    // Test 4: Check if users exist
    console.log('4. Checking users...');
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        role: true,
        currentTenants: true,
        maxTenants: true,
        availability: true
      }
    });
    console.log('Users found:', users);
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOfferCreation();

