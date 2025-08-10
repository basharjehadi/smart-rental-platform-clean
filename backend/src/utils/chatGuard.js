import { prisma } from './prisma.js';

/**
 * Enhanced chat guard that enforces payment requirements and conversation status
 * @param {string} conversationId - The conversation ID to check
 * @param {string} userId - The user ID requesting access
 * @returns {Promise<{ok: boolean, error?: string, errorCode?: string}>}
 */
export const canChat = async (conversationId, userId) => {
  try {
    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        offer: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!conversation) {
      return {
        ok: false,
        error: 'Conversation not found',
        errorCode: 'NOT_FOUND'
      };
    }

    // 2. Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });

    if (!participant) {
      return {
        ok: false,
        error: 'Not a participant in this conversation',
        errorCode: 'NOT_MEMBER'
      };
    }

    // 3. Check conversation status
    if (conversation.status !== 'ACTIVE') {
      return {
        ok: false,
        error: 'Conversation is not active',
        errorCode: 'CONVERSATION_NOT_ACTIVE'
      };
    }

    // 4. Check payment requirement - if conversation has an offer, it must be PAID
    if (conversation.offerId) {
      if (!conversation.offer) {
        return {
          ok: false,
          error: 'Payment required to access chat',
          errorCode: 'PAYMENT_REQUIRED'
        };
      }

      if (conversation.offer.status !== 'PAID') {
        return {
          ok: false,
          error: 'Payment required to access chat',
          errorCode: 'PAYMENT_REQUIRED'
        };
      }
    } else {
      // If no offer linked, still require payment (conversation.offerId is null)
      return {
        ok: false,
        error: 'Payment required to access chat',
        errorCode: 'PAYMENT_REQUIRED'
      };
    }

    // All checks passed
    return { ok: true };
  } catch (error) {
    console.error('Error in canChat guard:', error);
    return {
      ok: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR'
    };
  }
};

/**
 * Activate conversation after payment is completed
 * @param {string} offerId - The offer ID that was paid
 * @returns {Promise<void>}
 */
export const activateConversationAfterPayment = async (offerId) => {
  try {
    // Find all conversations linked to this offer
    const conversations = await prisma.conversation.findMany({
      where: { offerId }
    });

    // Update all conversations to ACTIVE status
    for (const conversation of conversations) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'ACTIVE' }
      });
    }

    console.log(`✅ Activated ${conversations.length} conversation(s) for offer ${offerId}`);
  } catch (error) {
    console.error('❌ Error activating conversations after payment:', error);
    throw error;
  }
};
