import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { sendPaymentSuccess } from '../utils/emailService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'pln',
      metadata: {
        purpose: purpose || 'RENT',
        offerId: offerId || '',
        tenantId: req.user.id
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
      paymentIntentId: paymentIntent.id
    });
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

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        stripePaymentIntentId,
        amount: amount / 100,
        status: 'SUCCEEDED',
        purpose: metadata.purpose || 'RENT',
        tenantId: metadata.tenantId,
        paidAt: new Date()
      }
    });

    console.log('✅ Payment record created:', payment.id);

    // Update offer status to PAID if this was a deposit payment
    if (metadata.offerId) {
      await prisma.offer.update({
        where: { id: metadata.offerId },
        data: { status: 'PAID' }
      });

      console.log('✅ Offer status updated to PAID:', metadata.offerId);

      // Get offer details for email notification
      const offer = await prisma.offer.findUnique({
        where: { id: metadata.offerId },
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
        await sendPaymentSuccess(
          offer.landlord.email,
          offer.landlord.name,
          offer.rentalRequest.tenant.name,
          offer.rentalRequest.title,
          amount / 100,
          new Date().toLocaleDateString()
        );
      }
    }

    // If this was a rent payment, mark the rent payment as paid
    if (metadata.purpose === 'RENT' && metadata.offerId) {
      // Find the current month's rent payment
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const rentPayment = await prisma.rentPayment.findFirst({
        where: {
          offerId: metadata.offerId,
          month: currentMonth,
          year: currentYear,
          status: 'PENDING'
        }
      });

      if (rentPayment) {
        await prisma.rentPayment.update({
          where: { id: rentPayment.id },
          data: {
            status: 'SUCCEEDED',
            paidDate: new Date()
          }
        });

        console.log('✅ Rent payment marked as paid:', rentPayment.id);

        // Unlock rental if it was locked
        const rentalRequest = await prisma.rentalRequest.findFirst({
          where: {
            offer: {
              some: {
                id: metadata.offerId
              }
            }
          }
        });

        if (rentalRequest?.isLocked) {
          await prisma.rentalRequest.update({
            where: { id: rentalRequest.id },
            data: {
              status: 'ACTIVE',
              isLocked: false
            }
          });

          console.log('🔓 Unlocked rental request:', rentalRequest.id);
        }
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
        tenantId: metadata.tenantId,
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
        tenantId: req.user.id
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

export {
  createPaymentIntent,
  handleWebhook,
  getMyPayments
}; 