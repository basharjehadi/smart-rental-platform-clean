import { prisma } from './prisma.js';

/**
 * Check if a user has paid for a specific property
 * @param {string} propertyId - The property ID to check
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>}
 */
export const checkPropertyPayment = async (propertyId, userId) => {
  try {
    // debug: checking property payment

    // Method 1: Check payments through offer -> property (direct offer payments)
    const paymentThroughOffer = await prisma.payment.findFirst({
      where: {
        userId: userId,
        status: 'SUCCEEDED',
        purpose: { in: ['DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH'] },
        offer: {
          propertyId: propertyId,
        },
      },
    });

    if (paymentThroughOffer) {
      // debug: payment through offer
      return true;
    }

    // Method 2: Check payments through rental request -> offer -> property (mock payments)
    const paymentThroughRequest = await prisma.payment.findFirst({
      where: {
        userId: userId,
        status: 'SUCCEEDED',
        purpose: { in: ['DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH'] },
        rentalRequest: {
          offers: {
            some: {
              propertyId: propertyId,
              status: 'PAID',
            },
          },
        },
      },
    });

    if (paymentThroughRequest) {
      // debug: payment through rental request
      return true;
    }

    // Method 3: Check if user has a PAID offer for this property (fallback)
    const paidOffer = await prisma.offer.findFirst({
      where: {
        propertyId: propertyId,
        rentalRequest: {
          tenantGroup: {
            members: { some: { userId: userId } },
          },
        },
        status: 'PAID',
      },
    });

    if (paidOffer) {
      // debug: paid offer
      return true;
    }

    // Method 4: Check if user has any successful payment for this property (last resort)
    const anyPayment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        status: 'SUCCEEDED',
        purpose: { in: ['DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH'] },
      },
      include: {
        rentalRequest: {
          include: {
            offers: {
              where: {
                propertyId: propertyId,
              },
            },
          },
        },
        offer: {
          where: {
            propertyId: propertyId,
          },
        },
      },
    });

    if (anyPayment) {
      // debug: general payment
      return true;
    }

    // debug: no payment found
    return false;
  } catch (error) {
    console.error('Error checking property payment:', error.message);
    return false;
  }
};

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
            status: true,
          },
        },
        property: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!conversation) {
      return {
        ok: false,
        error: 'Conversation not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // 2. Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return {
        ok: false,
        error: 'Not a participant in this conversation',
        errorCode: 'NOT_MEMBER',
      };
    }

    // 3. Check conversation status
    if (conversation.status !== 'ACTIVE') {
      return {
        ok: false,
        error: 'Conversation is not active',
        errorCode: 'CONVERSATION_NOT_ACTIVE',
      };
    }

    // 3.5 Landlord ownership shortcut: landlords can always reply in their own property's conversation
    if (conversation.property && conversation.property.organizationId) {
      // Check if user is a member of the organization that owns the property
      const isLandlord = await prisma.organizationMember.findFirst({
        where: {
          organizationId: conversation.property.organizationId,
          userId: userId,
          role: 'OWNER',
        },
      });

      if (isLandlord) {
        return { ok: true };
      }
    }

    // 4. Check payment requirement - either through offer or property
    if (conversation.offerId) {
      // Offer-based check (existing logic)
      // debug: offer-based check
      if (!conversation.offer) {
        // debug: no offer on conversation
        return {
          ok: false,
          error: 'Payment required to access chat',
          errorCode: 'PAYMENT_REQUIRED',
        };
      }

      if (conversation.offer.status !== 'PAID') {
        // debug: offer not paid
        return {
          ok: false,
          error: 'Payment required to access chat',
          errorCode: 'PAYMENT_REQUIRED',
        };
      }

      // debug: offer paid
    } else if (conversation.propertyId) {
      // Property-based check - verify user has paid for this property
      // debug: property-based check
      const hasPaid = await checkPropertyPayment(
        conversation.propertyId,
        userId
      );
      if (!hasPaid) {
        // debug: user not paid for property
        return {
          ok: false,
          error: 'Payment required to access chat',
          errorCode: 'PAYMENT_REQUIRED',
        };
      }

      // debug: user paid for property
    } else {
      // No property or offer linked
      // debug: invalid conversation linkage
      return {
        ok: false,
        error: 'Invalid conversation',
        errorCode: 'INVALID_CONVERSATION',
      };
    }

    // All checks passed
    return { ok: true };
  } catch (error) {
    console.error('Error in canChat guard:', error.message);
    return {
      ok: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
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
      where: { offerId },
    });

    // Update all conversations to ACTIVE status
    for (const conversation of conversations) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'ACTIVE' },
      });
    }

    // debug: conversations activated for offer
  } catch (error) {
    console.error(
      'Error activating conversations after payment:',
      error.message
    );
    throw error;
  }
};
