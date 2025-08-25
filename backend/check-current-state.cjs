const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentState() {
  try {
    console.log('🔍 CURRENT DATABASE STATE:\n');
    
    // Check payments
    const payments = await prisma.payment.findMany({
      include: {
        offer: true
      }
    });
    
    console.log('💰 PAYMENTS:', payments.length);
    payments.forEach(p => {
      console.log(`  - ID: ${p.id}`);
      console.log(`    Status: ${p.status}`);
      console.log(`    Purpose: ${p.purpose}`);
      console.log(`    Offer ID: ${p.offerId || 'NULL'}`);
      console.log(`    Amount: ${p.amount}`);
      console.log('');
    });
    
    // Check offers
    const offers = await prisma.offer.findMany({
      include: {
        property: true,
        tenant: true
      }
    });
    
    console.log('📋 OFFERS:', offers.length);
    offers.forEach(o => {
      console.log(`  - ID: ${o.id}`);
      console.log(`    Status: ${o.status}`);
      console.log(`    Property: ${o.property.name}`);
      console.log(`    Tenant: ${o.tenant.name}`);
      console.log('');
    });
    
    // Check conversations
    const conversations = await prisma.conversation.findMany({
      include: {
        participants: true,
        property: true
      }
    });
    
    console.log('💬 CONVERSATIONS:', conversations.length);
    conversations.forEach(c => {
      console.log(`  - ID: ${c.id}`);
      console.log(`    Status: ${c.status}`);
      console.log(`    Property ID: ${c.propertyId || 'NULL'}`);
      console.log(`    Participants: ${c.participants.length}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentState();
