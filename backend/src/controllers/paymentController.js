import Stripe from 'stripe';
import { prisma } from '../utils/prisma.js';
import { sendPaymentSuccess } from '../utils/emailService.js';
import { activateConversationAfterPayment } from '../utils/chatGuard.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to get rental request ID from offer ID
const getRentalRequestId = async (offerId) => {
  try {
    console.log('🔍 getRentalRequestId called with offerId:', offerId);
    
    if (!offerId) {
      console.log('⚠️ No offerId provided');
      return null;
    }

    // First try to find the offer directly
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: { rentalRequestId: true }
    });

    console.log('🔍 Found offer:', offer);
    
    if (offer) {
      console.log('✅ Returning rentalRequestId:', offer.rentalRequestId);
      return offer.rentalRequestId;
    }

    // If offer not found, try to find by payment intent ID (fallback)
    console.log('🔍 Offer not found, trying fallback method...');
    
    const paymentWithOffer = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: offerId // Sometimes offerId might actually be payment intent ID
      },
      include: {
        rentalRequest: {
          include: {
            offer: true
          }
        }
      }
    });

    if (paymentWithOffer?.rentalRequest?.offer) {
      console.log('✅ Found via fallback method, returning rentalRequestId:', paymentWithOffer.rentalRequestId);
      return paymentWithOffer.rentalRequestId;
    }

    // If still not found, try to find by user and amount (last resort)
    console.log('🔍 Trying to find by user and amount...');
    
    // This is a more complex fallback - we'll need to implement this differently
    // For now, let's log the issue and return null
    console.log('❌ Offer not found for ID:', offerId);
    return null;
  } catch (error) {
    console.error('❌ Error in getRentalRequestId:', error);
    return null;
  }
};

// Create payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, purpose, offerId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount. Amount must be greater than 0.'
      });
    }

    // Validate offer if offerId is provided
    let offer = null;
    if (offerId) {
      offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          rentalRequest: {
            include: {
              tenant: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          landlord: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      if (!offer) {
        return res.status(404).json({
          error: 'Offer not found.'
        });
      }

      // Check if offer is in valid state for payment
      if (!['ACCEPTED', 'PAID'].includes(offer.status)) {
        return res.status(400).json({
          error: 'Offer is not in a valid state for payment.'
        });
      }

      // Check if payment gateway is selected
      if (!offer.preferredPaymentGateway) {
        return res.status(400).json({
          error: 'Payment gateway not selected. Please accept the offer with a payment method first.'
        });
      }
    }

    // Handle different payment gateways
    const paymentGateway = offer?.preferredPaymentGateway || 'STRIPE';
    
    switch (paymentGateway) {
      case 'STRIPE':
        return await handleStripePayment(req, res, amount, purpose, offerId, offer);
      case 'PAYU':
        return await handlePayUPayment(req, res, amount, purpose, offerId, offer);
      case 'P24':
        return await handleP24Payment(req, res, amount, purpose, offerId, offer);
      case 'TPAY':
        return await handleTPayPayment(req, res, amount, purpose, offerId, offer);
      default:
        return res.status(400).json({
          error: 'Unsupported payment gateway.'
        });
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      error: 'Failed to create payment intent.'
    });
  }
};

// Handle Stripe webhook
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: 'Webhook processing failed.'
    });
  }
};

// Handle successful payment
const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    const { id: stripePaymentIntentId, metadata, amount } = paymentIntent;
    
    console.log('💰 Payment succeeded:', {
      paymentIntentId: stripePaymentIntentId,
      amount: amount / 100, // Convert from cents
      metadata
    });

    // ✅ IDEMPOTENT CHECK: Check if this payment was already processed
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId }
    });

    if (existingPayment) {
      console.log('ℹ️ Payment already processed, skipping duplicate processing:', stripePaymentIntentId);
      return; // Exit early - idempotent behavior
    }

    // BULLETPROOF PAYMENT LINKING - Multiple fallback methods
    let rentalRequestId = null;
    let offerId = metadata.offerId;

    // Method 1: Try to get rental request ID from offer
    if (offerId) {
      console.log('🔍 Method 1: Getting rental request ID from offer...');
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        select: { rentalRequestId: true }
      });
      
      if (offer) {
        rentalRequestId = offer.rentalRequestId;
        console.log('✅ Method 1 successful:', rentalRequestId);
      } else {
        console.log('❌ Method 1 failed: Offer not found');
      }
    }

    // Method 2: Try to find by payment intent ID (sometimes offerId is actually payment intent ID)
    if (!rentalRequestId && offerId) {
      console.log('🔍 Method 2: Trying payment intent ID as offer ID...');
      const paymentWithOffer = await prisma.payment.findFirst({
        where: {
          stripePaymentIntentId: offerId
        },
        include: {
          rentalRequest: {
            include: {
              offer: true
            }
          }
        }
      });

      if (paymentWithOffer?.rentalRequest?.offer) {
        rentalRequestId = paymentWithOffer.rentalRequestId;
        console.log('✅ Method 2 successful:', rentalRequestId);
      } else {
        console.log('❌ Method 2 failed: No payment found with this ID');
      }
    }

    // Method 3: Find by user and amount (last resort)
    if (!rentalRequestId) {
      console.log('🔍 Method 3: Finding by user and amount...');
      const userRentalRequests = await prisma.rentalRequest.findMany({
        where: {
          tenantId: metadata.tenantId,
          status: 'ACTIVE'
        },
        include: {
          offer: {
            where: {
              status: 'PAID'
            }
          },
          payments: {
            where: {
              status: 'SUCCEEDED'
            }
          }
        }
      });

      for (const request of userRentalRequests) {
        if (request.offer) {
          const expectedAmount = (request.offer.rentAmount || 0) + (request.offer.depositAmount || 0);
          if (Math.abs(expectedAmount - (amount / 100)) < 1 && request.payments.length === 0) {
            rentalRequestId = request.id;
            console.log('✅ Method 3 successful:', rentalRequestId);
            break;
          }
        }
      }

      if (!rentalRequestId) {
        console.log('❌ Method 3 failed: No matching rental request found');
      }
    }

    // Create payment record with the found rental request ID
    const payment = await prisma.payment.create({
      data: {
        stripePaymentIntentId,
        amount: amount / 100,
        status: 'SUCCEEDED',
        purpose: metadata.purpose || 'RENT',
        userId: metadata.tenantId,
        rentalRequestId: rentalRequestId
      }
    });

    console.log('✅ Payment record created:', {
      paymentId: payment.id,
      rentalRequestId: payment.rentalRequestId,
      purpose: payment.purpose,
      amount: payment.amount
    });

    // Update offer status to PAID and set isPaid to true if we have an offer ID
    if (offerId) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { 
          status: 'PAID',
          isPaid: true
        }
      });

      console.log('✅ Offer status updated to PAID:', offerId);

      // ✅ NEW: Activate conversations after payment
      await activateConversationAfterPayment(offerId);

      // Update property status to OCCUPIED when offer is paid
      try {
        const offer = await prisma.offer.findUnique({
          where: { id: offerId },
          select: { propertyId: true }
        });

        if (offer && offer.propertyId) {
          await prisma.property.update({
            where: { id: offer.propertyId },
            data: { status: 'OCCUPIED' }
          });
          console.log('✅ Property status updated to OCCUPIED:', offer.propertyId);
        }
      } catch (propertyUpdateError) {
        console.error('❌ Error updating property status:', propertyUpdateError);
        // Don't fail the payment if property status update fails
      }

      // Note: RentPayment records should only be created for monthly rent payments
      // DEPOSIT_AND_FIRST_MONTH payments are stored only in the Payment table
      // to avoid duplication in payment history
      // 
      // Polish rental logic: First month rent is pro-rated based on 30-day calculation
      // Regular months: Full monthly rent regardless of calendar days
    }

    // BULLETPROOF CONTRACT GENERATION
    if (metadata.purpose === 'DEPOSIT_AND_FIRST_MONTH' && rentalRequestId) {
      try {
        console.log('🔧 Auto-generating contract after payment...');
        
        // Check if contract already exists
        const existingContract = await prisma.contract.findUnique({
          where: { rentalRequestId: rentalRequestId }
        });

        if (!existingContract) {
          // Import contract generation function
          const { generateContractForRentalRequest } = await import('./contractController.js');
          await generateContractForRentalRequest(rentalRequestId);
          console.log('✅ Contract auto-generated successfully');
        } else {
          console.log('ℹ️ Contract already exists, skipping generation');
        }
      } catch (contractError) {
        console.error('❌ Error auto-generating contract:', contractError);
        // Don't fail the payment if contract generation fails
      }
    }

    // Send email notifications
    if (rentalRequestId) {
      try {
        const offer = await prisma.offer.findUnique({
          where: { id: offerId },
          include: {
            rentalRequest: {
              include: {
                tenant: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            landlord: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });

        // Send payment success notification to landlord
        if (offer?.landlord?.email) {
          console.log('📧 Sending payment success notification to landlord');
          const paymentDescription = metadata.purpose === 'DEPOSIT_AND_FIRST_MONTH' 
            ? 'Deposit and First Month Rent' 
            : 'Rent Payment';
          await sendPaymentSuccess(
            offer.landlord.email,
            offer.landlord.name,
            offer.rentalRequest.tenant.name,
            offer.rentalRequest.title,
            amount / 100,
            new Date().toLocaleDateString(),
            paymentDescription
          );
        }
      } catch (emailError) {
        console.error('❌ Error sending email notification:', emailError);
        // Don't fail the payment if email fails
      }
    }

  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  try {
    const { id: stripePaymentIntentId, metadata, last_payment_error } = paymentIntent;
    
    console.log('❌ Payment failed:', {
      paymentIntentId: stripePaymentIntentId,
      error: last_payment_error?.message,
      metadata
    });

    // Create payment record with failed status
    await prisma.payment.create({
      data: {
        stripePaymentIntentId,
        amount: paymentIntent.amount / 100,
        status: 'FAILED',
        purpose: metadata.purpose || 'RENT',
        userId: metadata.tenantId,
        paidAt: new Date()
      }
    });

    console.log('✅ Failed payment record created');
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
};

// Get payment history for tenant
const getMyPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Handle Stripe payment
const handleStripePayment = async (req, res, amount, purpose, offerId, offer) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'pln',
      metadata: {
        purpose: purpose || 'RENT',
        offerId: offerId || '',
        tenantId: req.user.id,
        paymentType: purpose === 'DEPOSIT_AND_FIRST_MONTH' ? 'deposit_and_first_month' : 'rent'
      }
    });

    // Update offer with paymentIntentId if offerId is provided
    if (offerId) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { paymentIntentId: paymentIntent.id }
      });
    }

    res.json({
      client_secret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentGateway: 'STRIPE'
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({
      error: 'Failed to create Stripe payment intent.'
    });
  }
};

// Handle PayU payment
const handlePayUPayment = async (req, res, amount, purpose, offerId, offer) => {
  try {
    // TODO: Implement PayU payment integration
    // For now, return a mock response
    const mockPaymentId = `payu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      paymentId: mockPaymentId,
      paymentGateway: 'PAYU',
      redirectUrl: `https://secure.payu.com/payment/${mockPaymentId}`,
      message: 'PayU payment integration coming soon'
    });
  } catch (error) {
    console.error('PayU payment error:', error);
    res.status(500).json({
      error: 'PayU payment integration not yet implemented.'
    });
  }
};

// Handle Przelewy24 payment
const handleP24Payment = async (req, res, amount, purpose, offerId, offer) => {
  try {
    // TODO: Implement Przelewy24 payment integration
    // For now, return a mock response
    const mockPaymentId = `p24_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      paymentId: mockPaymentId,
      paymentGateway: 'P24',
      redirectUrl: `https://secure.przelewy24.pl/payment/${mockPaymentId}`,
      message: 'Przelewy24 payment integration coming soon'
    });
  } catch (error) {
    console.error('P24 payment error:', error);
    res.status(500).json({
      error: 'Przelewy24 payment integration not yet implemented.'
    });
  }
};

// Handle Tpay payment
const handleTPayPayment = async (req, res, amount, purpose, offerId, offer) => {
  try {
    // TODO: Implement Tpay payment integration
    // For now, return a mock response
    const mockPaymentId = `tpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      paymentId: mockPaymentId,
      paymentGateway: 'TPAY',
      redirectUrl: `https://secure.tpay.com/payment/${mockPaymentId}`,
      message: 'Tpay payment integration coming soon'
    });
  } catch (error) {
    console.error('Tpay payment error:', error);
    res.status(500).json({
      error: 'Tpay payment integration not yet implemented.'
    });
  }
};

export {
  createPaymentIntent,
  handleWebhook,
  getMyPayments
}; 