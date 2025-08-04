import { prisma } from './backend/src/utils/prisma.js';

const testDatabaseConnection = async () => {
  try {
    console.log('🧪 Testing Database Connection...\n');

    // Test 1: Check if we can connect to the database
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test 2: Check if rental_requests table exists and has data
    console.log('\n2️⃣ Checking rental_requests table...');
    const requestCount = await prisma.rentalRequest.count();
    console.log('✅ Rental requests table exists');
    console.log('📋 Total rental requests in database:', requestCount);

    // Test 3: Try to fetch all rental requests
    console.log('\n3️⃣ Fetching all rental requests...');
    const allRequests = await prisma.rentalRequest.findMany({
      take: 5, // Limit to 5 for testing
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('✅ Successfully fetched rental requests');
    console.log('📋 Sample requests:', allRequests.length);
    
    if (allRequests.length > 0) {
      console.log('\n📋 First request details:');
      const firstRequest = allRequests[0];
      console.log('ID:', firstRequest.id);
      console.log('Title:', firstRequest.title);
      console.log('Location:', firstRequest.location);
      console.log('Budget:', firstRequest.budget);
      console.log('Tenant:', firstRequest.tenant?.name || 'Unknown');
    }

    // Test 4: Check if tenant exists
    console.log('\n4️⃣ Checking tenant user...');
    const tenant = await prisma.user.findFirst({
      where: {
        email: 'tenant@test.com'
      }
    });
    
    if (tenant) {
      console.log('✅ Tenant user found');
      console.log('📋 Tenant ID:', tenant.id);
      console.log('📋 Tenant name:', tenant.name);
    } else {
      console.log('❌ Tenant user not found');
    }

    console.log('\n🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testDatabaseConnection(); 