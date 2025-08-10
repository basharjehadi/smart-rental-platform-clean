import { prisma } from '../../utils/prisma.js';

/**
 * Socket guard to verify if a user can chat in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} userId - The user ID attempting to chat
 * @returns {Promise<{canChat: boolean, errorCode?: string, errorMessage?: string}>}
 */
export const canChat = async (conversationId, userId) => {
  try {
    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId },
          select: { id: true, role: true }
        },
        offer: {
          select: { 
            id: true, 
            status: true, 
            isPaid: true,
            payments: {
              where: { status: 'SUCCEEDED' },
              select: { id: true }
            }
          }
        }
      }
    });

    if (!conversation) {
      return {
        canChat: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Conversation not found'
      };
    }

    // Check if user is a participant
    if (conversation.participants.length === 0) {
      return {
        canChat: false,
        errorCode: 'NOT_MEMBER',
        errorMessage: 'You are not a member of this conversation'
      };
    }

    // Check if conversation is active
    if (conversation.status !== 'ACTIVE') {
      return {
        canChat: false,
        errorCode: 'CONVERSATION_NOT_ACTIVE',
        errorMessage: 'This conversation is not active'
      };
    }

    // Check payment status
    if (conversation.offer) {
      // Check if offer is paid (either isPaid flag or successful payment exists)
      const isPaid = conversation.offer.isPaid || conversation.offer.status === 'PAID' || conversation.offer.payments.length > 0;
      
      if (!isPaid) {
        return {
          canChat: false,
          errorCode: 'PAYMENT_REQUIRED',
          errorMessage: 'Payment is required to chat in this conversation'
        };
      }
    }

    return {
      canChat: true,
      errorCode: null,
      errorMessage: null
    };
  } catch (error) {
    console.error('Error in canChat guard:', error);
    return {
      canChat: false,
      errorCode: 'INTERNAL_ERROR',
      errorMessage: 'Internal server error'
    };
  }
};

/**
 * Get detailed conversation info for debugging
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>}
 */
export const getConversationInfo = async (conversationId) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        offer: {
          select: { 
            id: true, 
            status: true, 
            isPaid: true,
            rentAmount: true,
            payments: {
              select: { id: true, status: true, amount: true }
            }
          }
        },
        property: {
          select: { id: true, address: true, city: true }
        }
      }
    });

    return conversation;
  } catch (error) {
    console.error('Error getting conversation info:', error);
    return null;
  }
};

