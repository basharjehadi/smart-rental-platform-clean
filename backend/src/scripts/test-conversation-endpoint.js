const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConversationEndpoint() {
  try {
    const conversationId = 'cmeqr70jl000cex3sum2p8kpp';

    console.log(`🔍 Testing conversation endpoint for ID: ${conversationId}`);

    // Test 1: Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        property: true,
        offer: true,
      },
    });

    if (!conversation) {
      console.log('❌ Conversation not found in database');
      return;
    }

    console.log('✅ Conversation found in database');
    console.log(`   Status: ${conversation.status}`);
    console.log(`   Property ID: ${conversation.propertyId}`);
    console.log(`   Participants: ${conversation.participants.length}`);

    // Test 2: Check if canChat function works
    const { canChat } = await import('./src/utils/chatGuard.js');

    // We need a user ID to test canChat - let's use the first participant
    if (conversation.participants.length > 0) {
      const userId = conversation.participants[0].userId;
      console.log(`🔍 Testing canChat for user: ${userId}`);

      const chatGuard = await canChat(conversationId, userId);
      console.log(`   canChat result:`, chatGuard);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConversationEndpoint();
