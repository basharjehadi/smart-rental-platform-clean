import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAppData() {
  try {
    console.log('🔍 Checking app data...\n');

    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });
    console.log('👥 Users:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    // Check properties
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        landlordId: true,
        status: true,
        address: true,
        city: true
      }
    });
    console.log('\n🏠 Properties:', properties.length);
    properties.forEach(property => {
      console.log(`  - ${property.name} (${property.status}) - ${property.address}, ${property.city}`);
    });

    // Check rental requests
    const rentalRequests = await prisma.rentalRequest.findMany({
      select: {
        id: true,
        title: true,
        tenantId: true,
        status: true,
        location: true,
        budget: true,
        createdAt: true
      }
    });
    console.log('\n📝 Rental Requests:', rentalRequests.length);
    rentalRequests.forEach(request => {
      console.log(`  - ID: ${request.id} - "${request.title}" - Status: ${request.status} - Location: ${request.location} - Budget: ${request.budget} - Created: ${request.createdAt}`);
    });

    // Check offers
    const offers = await prisma.offer.findMany({
      select: {
        id: true,
        propertyId: true,
        tenantId: true,
        landlordId: true,
        status: true,
        rentAmount: true,
        createdAt: true
      }
    });
    console.log('\n💼 Offers:', offers.length);
    offers.forEach(offer => {
      console.log(`  - ID: ${offer.id} - Status: ${offer.status} - Rent: ${offer.rentAmount} - Created: ${offer.createdAt}`);
    });

    // Check offers with more details
    const offersWithDetails = await prisma.offer.findMany({
      include: {
        tenant: { select: { name: true, email: true } },
        landlord: { select: { name: true, email: true } },
        property: { select: { name: true, address: true } },
        rentalRequest: { select: { title: true, location: true } }
      }
    });
    console.log('\n💼 Offers with Details:');
    offersWithDetails.forEach(offer => {
      console.log(`  - Offer ${offer.id}:`);
      console.log(`    Tenant: ${offer.tenant.name} (${offer.tenant.email})`);
      console.log(`    Landlord: ${offer.landlord.name} (${offer.landlord.email})`);
      console.log(`    Property: ${offer.property?.name || 'No property'} (${offer.property?.address || 'No address'})`);
      console.log(`    Rental Request: "${offer.rentalRequest.title}" in ${offer.rentalRequest.location}`);
      console.log(`    Status: ${offer.status} - Rent: ${offer.rentAmount}`);
    });

    // Check notifications
    const notifications = await prisma.notification.findMany({
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        isRead: true,
        createdAt: true
      }
    });
    console.log('\n🔔 Notifications:', notifications.length);
    notifications.forEach(notification => {
      console.log(`  - ${notification.type}: ${notification.title} (${notification.isRead ? 'Read' : 'Unread'})`);
    });

    // Check conversations
    const conversations = await prisma.conversation.findMany({
      select: {
        id: true,
        type: true,
        status: true,
        propertyId: true,
        offerId: true,
        createdAt: true
      }
    });
    console.log('\n💬 Conversations:', conversations.length);
    conversations.forEach(conv => {
      console.log(`  - ID: ${conv.id} - Type: ${conv.type} - Status: ${conv.status} - Property: ${conv.propertyId || 'None'} - Offer: ${conv.offerId || 'None'}`);
    });

    // Check payments
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        userId: true,
        purpose: true,
        status: true,
        amount: true,
        createdAt: true
      }
    });
    console.log('\n💰 Payments:', payments.length);
    payments.forEach(payment => {
      console.log(`  - ID: ${payment.id} - Purpose: ${payment.purpose} - Status: ${payment.status} - Amount: ${payment.amount} - Created: ${payment.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error checking app data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppData();
