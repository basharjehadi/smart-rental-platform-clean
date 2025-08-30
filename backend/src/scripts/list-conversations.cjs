const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listConversations() {
  try {
    console.log('🔍 Listing all conversations...\n');

    const conversations = await prisma.conversation.findMany({
      include: {
        participants: true,
        property: true,
        offer: true,
      },
    });

    if (conversations.length === 0) {
      console.log('❌ No conversations found in database');
      return;
    }

    console.log(`📊 Found ${conversations.length} conversation(s):\n`);

    conversations.forEach((conv, index) => {
      console.log(`${index + 1}. Conversation ID: ${conv.id}`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Property ID: ${conv.propertyId || 'None'}`);
      console.log(`   Offer ID: ${conv.offerId || 'None'}`);
      console.log(`   Title: ${conv.title || 'None'}`);
      console.log(`   Type: ${conv.type}`);
      console.log(`   Participants: ${conv.participants.length}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listConversations();
