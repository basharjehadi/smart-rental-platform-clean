import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n');

    // Check users with more details
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    console.log('👥 Users:', users.length);
    users.forEach((user) => {
      console.log(
        `  - ID: ${user.id} | ${user.name} (${user.email}) - ${user.role} | Created: ${user.createdAt}`
      );
    });

    // Check properties with more details
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        city: true,
        landlordId: true,
        createdAt: true,
      },
    });
    console.log('\n🏠 Properties:', properties.length);
    properties.forEach((property) => {
      console.log(
        `  - ID: ${property.id} | ${property.name} (${property.status}) - ${property.city || 'No city'} | Landlord: ${property.landlordId} | Created: ${property.createdAt}`
      );
    });

    // Check rental requests with more details
    const rentalRequests = await prisma.rentalRequest.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        status: true,
        tenantId: true,
        createdAt: true,
      },
    });
    console.log('\n📝 Rental Requests:', rentalRequests.length);
    rentalRequests.forEach((request) => {
      console.log(
        `  - ID: ${request.id} | "${request.title}" - Location: ${request.location} - Status: ${request.status} | Tenant: ${request.tenantId} | Created: ${request.createdAt}`
      );
    });

    // Check landlord-request matches
    const matches = await prisma.landlordRequestMatch.findMany();
    console.log('\n🔗 Landlord-Request Matches:', matches.length);
    matches.forEach((match) => {
      console.log(
        `  - Landlord ${match.landlordId} -> Request ${match.rentalRequestId}`
      );
    });

    // Check notifications
    const notifications = await prisma.notification.findMany();
    console.log('\n🔔 Notifications:', notifications.length);
    notifications.forEach((notification) => {
      console.log(
        `  - ${notification.type}: ${notification.title} for user ${notification.userId}`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
