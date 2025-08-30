const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n');

    // Check payments
    const payments = await prisma.payment.findMany({
      include: {
        offer: {
          include: {
            property: true,
          },
        },
      },
    });

    console.log('💰 Payments found:', payments.length);
    payments.forEach((payment) => {
      console.log(`  - Payment ID: ${payment.id}`);
      console.log(`    Status: ${payment.status}`);
      console.log(`    Purpose: ${payment.purpose}`);
      console.log(`    User ID: ${payment.userId}`);
      console.log(`    Offer ID: ${payment.offerId || 'N/A'}`);
      if (payment.offer) {
        console.log(
          `    Property: ${payment.offer.property.name} (${payment.offer.property.id})`
        );
      }
      console.log('');
    });

    // Check conversations
    const conversations = await prisma.conversation.findMany({
      include: {
        participants: true,
        property: true,
      },
    });

    console.log('💬 Conversations found:', conversations.length);
    conversations.forEach((conv) => {
      console.log(`  - Conversation ID: ${conv.id}`);
      console.log(`    Title: ${conv.title}`);
      console.log(`    Status: ${conv.status}`);
      console.log(`    Property ID: ${conv.propertyId || 'N/A'}`);
      console.log(`    Participants: ${conv.participants.length}`);
      conv.participants.forEach((p) => {
        console.log(`      - User ID: ${p.userId}, Role: ${p.role}`);
      });
      console.log('');
    });

    // Check properties
    const properties = await prisma.property.findMany({
      include: {
        landlord: true,
      },
    });

    console.log('🏠 Properties found:', properties.length);
    properties.forEach((prop) => {
      console.log(`  - Property ID: ${prop.id}`);
      console.log(`    Name: ${prop.name}`);
      console.log(`    Landlord: ${prop.landlord.name} (${prop.landlord.id})`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
