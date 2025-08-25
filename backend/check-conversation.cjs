const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkConversation() {
  try {
    const conversationId = 'cmeqr70j1000cex3sum2p8kpp';
    
    console.log(`🔍 Checking conversation: ${conversationId}`);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        property: true,
        offer: true
      }
    });
    
    if (!conversation) {
      console.log('❌ Conversation not found');
      return;
    }
    
    console.log('\n📋 Conversation Details:');
    console.log(`   ID: ${conversation.id}`);
    console.log(`   Status: ${conversation.status}`);
    console.log(`   Property ID: ${conversation.propertyId || 'None'}`);
    console.log(`   Offer ID: ${conversation.offerId || 'None'}`);
    console.log(`   Title: ${conversation.title || 'None'}`);
    console.log(`   Type: ${conversation.type}`);
    
    console.log('\n👥 Participants:');
    conversation.participants.forEach(p => {
      console.log(`   - User ID: ${p.userId}, Role: ${p.role}`);
    });
    
    if (conversation.property) {
      console.log('\n🏠 Property:');
      console.log(`   ID: ${conversation.property.id}`);
      console.log(`   Name: ${conversation.property.name}`);
      console.log(`   Landlord ID: ${conversation.property.landlordId}`);
    }
    
    if (conversation.offer) {
      console.log('\n📋 Offer:');
      console.log(`   ID: ${conversation.offer.id}`);
      console.log(`   Status: ${conversation.offer.status}`);
      console.log(`   Tenant ID: ${conversation.offer.tenantId}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConversation();
