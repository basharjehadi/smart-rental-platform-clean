import Stripe from 'stripe';
import { prisma } from '../utils/prisma.js';
import { sendPaymentSuccess } from '../utils/emailService.js';
import { activateConversationAfterPayment } from '../utils/chatGuard.js';
import propertyAvailabilityService from '../services/propertyAvailabilityService.js';
import reviewService from '../services/reviewService.js';

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

// Complete mock payment and update database
const completeMockPayment = async (req, res) => {
  try {
    const { paymentId, amount, purpose, offerId, selectedPayments } = req.body;
    const userId = req.user.id;

    console.log('🔍 Completing mock payment:', { paymentId, amount, purpose, offerId, selectedPayments });
    console.log('🔍 User ID:', userId);

    if (!paymentId || !amount || !purpose || !offerId) {
      return res.status(400).json({
        error: 'Missing required payment information'
      });
    }

    // For monthly rent payments, selectedPayments is required
    if (purpose === 'MONTHLY_RENT' && (!selectedPayments || selectedPayments.length === 0)) {
      return res.status(400).json({
        error: 'Selected payments are required for monthly rent'
      });
    }

    // For monthly rent payments, create RentPayment records
    if (purpose === 'MONTHLY_RENT') {
      // First create a general payment record for tracking
      // Ensure we link payment to the tenant's rentalRequest for landlord filtering
      let rentRentalRequestId = null;
      try {
        if (offerId) {
          const rentOffer = await prisma.offer.findUnique({
            where: { id: offerId },
            select: { rentalRequestId: true }
          });
          rentRentalRequestId = rentOffer?.rentalRequestId || null;
        }
      } catch (lookupErr) {
        console.error('❌ Error looking up offer for MONTHLY_RENT:', lookupErr);
      }

      const generalPayment = await prisma.payment.create({
        data: {
          amount: amount,
          status: 'SUCCEEDED',
          purpose: 'RENT',
          gateway: 'PAYU',
          userId: userId,
          offerId: offerId, // This will be the offer ID
          ...(rentRentalRequestId ? { rentalRequestId: rentRentalRequestId } : {}),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('✅ Created general payment record:', generalPayment.id);

      const rentPayments = [];

      console.log('🔍 Processing selected payments:', selectedPayments);
      
      for (const payment of selectedPayments) {
        console.log('🔍 Processing payment:', payment);
        // Create a new rent payment record
        const rentPayment = await prisma.rentPayment.create({
          data: {
            amount: payment.amount,
            status: 'SUCCEEDED',
            dueDate: new Date(payment.dueDate),
            paidDate: new Date(),
            month: new Date(payment.dueDate).getMonth() + 1,
            year: new Date(payment.dueDate).getFullYear(),
            lateFee: 0,
            gracePeriod: 5,
            isOverdue: false,
            userId: userId,
            paymentId: generalPayment.id // Link to the general payment record
          }
        });

        rentPayments.push(rentPayment);
        console.log('✅ Created rent payment record:', rentPayment.id);
      }

      return res.json({
        success: true,
        message: 'Mock payment completed successfully',
        rentPayments: rentPayments,
        generalPayment: generalPayment
      });
    }

    // Handle DEPOSIT_AND_FIRST_MONTH payments (deposit + first month)
    if (purpose === 'DEPOSIT_AND_FIRST_MONTH') {
      console.log('🔍 Processing DEPOSIT_AND_FIRST_MONTH payment...');
      // Idempotency: avoid duplicate records if this endpoint is hit multiple times
      const existing = await prisma.payment.findFirst({
        where: {
          userId: userId,
          purpose: 'DEPOSIT_AND_FIRST_MONTH',
          status: 'SUCCEEDED',
          offerId: offerId || undefined
        }
      });
      if (existing) {
        console.log('ℹ️ Existing DEPOSIT_AND_FIRST_MONTH payment found, returning existing.');
        return res.json({ success: true, message: 'Payment already recorded', payment: existing });
      }
      
      // Create the main payment record with offerId for chat system
      // Also link to rentalRequestId so landlord dashboards can filter correctly
      let depositRentalRequestId = null;
      try {
        if (offerId) {
          const depOffer = await prisma.offer.findUnique({
            where: { id: offerId },
            select: { rentalRequestId: true }
          });
          depositRentalRequestId = depOffer?.rentalRequestId || null;
        }
      } catch (lookupErr) {
        console.error('❌ Error looking up offer for DEPOSIT_AND_FIRST_MONTH:', lookupErr);
      }

      const depositPayment = await prisma.payment.create({
        data: {
          amount: amount,
          status: 'SUCCEEDED',
          purpose: 'DEPOSIT_AND_FIRST_MONTH',
          gateway: 'PAYU',
          userId: userId,
          offerId: offerId, // This is crucial for chat system to work
          ...(depositRentalRequestId ? { rentalRequestId: depositRentalRequestId } : {}),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('✅ Created DEPOSIT_AND_FIRST_MONTH payment record:', depositPayment.id);
      console.log('✅ Payment linked to offerId:', offerId);

      // Update offer status to PAID
      if (offerId) {
        try {
          await prisma.offer.update({
            where: { id: offerId },
            data: { 
              status: 'PAID',
              paymentDate: new Date()
            }
          });
          console.log('✅ Updated offer status to PAID:', offerId);

          // Fetch related identifiers for follow-up updates
          const paidOffer = await prisma.offer.findUnique({
            where: { id: offerId },
            select: { propertyId: true, rentalRequestId: true }
          });

          // Invalidate other offers for the same property (PENDING/ACCEPTED → REJECTED)
          try {
            if (paidOffer?.propertyId) {
              const otherOffers = await prisma.offer.findMany({
                where: {
                  propertyId: paidOffer.propertyId,
                  id: { not: offerId },
                  status: { in: ['PENDING', 'ACCEPTED'] }
                }
              });

              if (otherOffers.length > 0) {
                await prisma.offer.updateMany({
                  where: {
                    propertyId: paidOffer.propertyId,
                    id: { not: offerId },
                    status: { in: ['PENDING', 'ACCEPTED'] }
                  },
                  data: { status: 'REJECTED', updatedAt: new Date() }
                });
                console.log(`✅ Invalidated ${otherOffers.length} competing offers for property ${paidOffer.propertyId}`);
              }
            }
          } catch (invalidateErr) {
            console.error('❌ Error invalidating competing offers:', invalidateErr);
          }

          // Update property availability to RENTED
          try {
            if (paidOffer?.propertyId) {
              await propertyAvailabilityService.updatePropertyAvailability(
                paidOffer.propertyId,
                false,
                'RENTED'
              );
              console.log('✅ Property set to RENTED and unavailable:', paidOffer.propertyId);
            }
          } catch (propErr) {
            console.error('❌ Error updating property availability:', propErr);
          }

          // Update rental request status to MATCHED (moves it out of Active in UIs)
          try {
            if (paidOffer?.rentalRequestId) {
              await prisma.rentalRequest.update({
                where: { id: paidOffer.rentalRequestId },
                data: { status: 'MATCHED', updatedAt: new Date() }
              });
              console.log('✅ Rental request marked as MATCHED:', paidOffer.rentalRequestId);

              // Remove from request pool
              try {
                const requestPoolService = await import('../services/requestPoolService.js');
                await requestPoolService.default.removeFromPool(paidOffer.rentalRequestId, 'MATCHED');
                console.log(`✅ Removed request ${paidOffer.rentalRequestId} from pool after payment`);
              } catch (poolError) {
                console.error('❌ Error removing request from pool:', poolError);
              }
            }
          } catch (rrErr) {
            console.error('❌ Error updating rental request status to MATCHED:', rrErr);
          }

          // Generate contract after successful mock payment
          try {
            if (paidOffer?.rentalRequestId) {
              const { generateContractForRentalRequest } = await import('./contractController.js');
              const contract = await generateContractForRentalRequest(paidOffer.rentalRequestId);
              console.log('✅ Contract generated after mock payment:', {
                contractId: contract?.id,
                contractNumber: contract?.contractNumber
              });
            }
          } catch (contractErr) {
            console.error('❌ Error generating contract after mock payment:', contractErr);
          }
        } catch (offerUpdateError) {
          console.error('❌ Error updating offer status:', offerUpdateError);
        }
      }

      return res.json({
        success: true,
        message: 'Mock DEPOSIT_AND_FIRST_MONTH payment completed successfully',
        payment: depositPayment
      });
    }

    return res.status(400).json({
      error: 'Unsupported payment purpose'
    });

  } catch (error) {
    console.error('Error completing mock payment:', error);
    res.status(500).json({
      error: 'Failed to complete mock payment'
    });
  }
};

// Create payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, purpose, offerId, paymentGateway: requestedGateway } = req.body;
    
    // Check if we should use mock payments
    const paymentProvider = process.env.PAYMENT_PROVIDER || 'MOCK';
    const allowMockPayments = process.env.ALLOW_MOCK_PAYMENTS === 'true';
    
    console.log('🔍 Payment provider:', paymentProvider);
    console.log('🔍 Allow mock payments:', allowMockPayments);

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

      // Check if payment gateway is selected (only for initial offer acceptance)
      // For monthly rent payments, we'll use the requested gateway instead
      if (purpose !== 'MONTHLY_RENT' && !offer.preferredPaymentGateway) {
        return res.status(400).json({
          error: 'Payment gateway not selected. Please accept the offer with a payment method first.'
        });
      }
    }

    // Handle different payment gateways
    // For monthly rent payments, prioritize the requested gateway
    const paymentGateway = purpose === 'MONTHLY_RENT' 
      ? (requestedGateway || offer?.preferredPaymentGateway || 'STRIPE')
      : (offer?.preferredPaymentGateway || requestedGateway || 'STRIPE');
    
    console.log('🔍 Selected payment gateway:', paymentGateway);
    
    // If using mock payments, always use mock gateways regardless of selection
    if (paymentProvider === 'MOCK' && allowMockPayments) {
      console.log('🔍 Using mock payment system');
      
      // Map Stripe to a mock gateway for testing
      if (paymentGateway === 'STRIPE') {
        console.log('🔍 Stripe selected, using mock PayU instead');
        return await handlePayUPayment(req, res, amount, purpose, offerId, offer);
      }
      
      // Use the selected gateway if it's already a mock gateway
      switch (paymentGateway) {
        case 'PAYU':
        case 'P24':
        case 'TPAY':
          return await handlePayUPayment(req, res, amount, purpose, offerId, offer);
        default:
          // Fallback to PayU for any other gateway
          return await handlePayUPayment(req, res, amount, purpose, offerId, offer);
      }
    }
    
    // Real payment processing
    console.log('🔍 Using real payment system');
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
    // Ensure we also persist offerId so downstream checks (e.g., chat access by property) work
    const payment = await prisma.payment.create({
      data: {
        stripePaymentIntentId,
        amount: amount / 100,
        status: 'SUCCEEDED',
        purpose: metadata.purpose || 'RENT',
        userId: metadata.tenantId,
        rentalRequestId: rentalRequestId,
        // Persist offerId when available to enable joins by property later
        ...(offerId ? { offerId } : {})
      }
    });

    console.log('✅ Payment record created:', {
      paymentId: payment.id,
      rentalRequestId: payment.rentalRequestId,
      purpose: payment.purpose,
      amount: payment.amount
    });

    // Update offer status to PAID if we have an offer ID
    if (offerId) {
      // Mark offer as PAID and set move-in verification deadline if available
      const paidOffer = await prisma.offer.update({
        where: { id: offerId },
        data: { status: 'PAID' },
        include: { rentalRequest: true }
      });
      // Compute deadline: moveInDate + 24h if moveInDate exists
      if (!paidOffer.moveInVerificationDeadline) {
        const baseDate = paidOffer.rentalRequest?.moveInDate || new Date();
        const deadline = new Date(new Date(baseDate).getTime() + 24 * 60 * 60 * 1000);
        await prisma.offer.update({
          where: { id: offerId },
          data: { moveInVerificationDeadline: deadline }
        });
      }

      console.log('✅ Offer status updated to PAID:', offerId);

      // 🚀 SCALABILITY: Automatically invalidate ALL other offers for the same property
      // This implements the "first to pay wins" competition system
      try {
        const offer = await prisma.offer.findUnique({
          where: { id: offerId },
          select: { 
            propertyId: true,
            rentalRequestId: true 
          }
        });

        if (offer && offer.propertyId) {
          console.log(`🏆 First tenant paid for property ${offer.propertyId} - invalidating other offers`);
          
          // Find and reject all other PENDING or ACCEPTED offers for the same property
          const otherOffers = await prisma.offer.findMany({
            where: {
              propertyId: offer.propertyId,
              id: { not: offerId },
              status: { in: ['PENDING', 'ACCEPTED'] }
            }
          });

          if (otherOffers.length > 0) {
            await prisma.offer.updateMany({
              where: {
                propertyId: offer.propertyId,
                id: { not: offerId },
                status: { in: ['PENDING', 'ACCEPTED'] }
              },
              data: {
                status: 'REJECTED',
                updatedAt: new Date()
              }
            });

            console.log(`✅ Invalidated ${otherOffers.length} other offers for property ${offer.propertyId}`);
            
            // Send notifications to other tenants that their offers were rejected
            for (const rejectedOffer of otherOffers) {
              try {
                const tenantRequest = await prisma.rentalRequest.findUnique({
                  where: { id: rejectedOffer.rentalRequestId },
                  include: {
                    tenantGroup: {
                      include: {
                        members: {
                          where: { isPrimary: true },
                          include: {
                            user: {
                              select: { email: true, name: true }
                            }
                          }
                        }
                      }
                    }
                  }
                });

                // Get the primary tenant from the tenant group
                const primaryMember = tenantRequest?.tenantGroup?.members?.[0];
                const tenant = primaryMember?.user;

                if (tenant?.email) {
                  console.log(`📧 Sending rejection notification to ${tenant.email}`);
                  // You can implement email notification here
                  // await sendOfferRejectedNotification(tenant.email, tenant.name);
                }
              } catch (notificationError) {
                console.error(`❌ Error sending rejection notification for offer ${rejectedOffer.id}:`, notificationError);
              }
            }
          }

          // 🚀 SCALABILITY: Remove the rental request from the pool since it's now matched
          // Import and use the request pool service
          try {
            const requestPoolService = await import('../services/requestPoolService.js');
            await requestPoolService.default.removeFromPool(offer.rentalRequestId, 'MATCHED');
            console.log(`✅ Removed request ${offer.rentalRequestId} from pool after payment`);
          } catch (poolError) {
            console.error(`❌ Error removing request from pool:`, poolError);
          }
        }
      } catch (invalidationError) {
        console.error('❌ Error invalidating other offers:', invalidationError);
        // Don't fail the payment if offer invalidation fails
      }

      // Create RentPayment record for DEPOSIT_AND_FIRST_MONTH payments
      if (metadata.purpose === 'DEPOSIT_AND_FIRST_MONTH') {
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

      // Update property status to RENTED when offer is paid
      try {
        const offer = await prisma.offer.findUnique({
          where: { id: offerId },
          select: { propertyId: true }
        });

        if (offer && offer.propertyId) {
          // Use property availability service to update property status and availability
          await propertyAvailabilityService.updatePropertyAvailability(
            offer.propertyId, 
            false, // availability = false when rented
            'RENTED' // status = RENTED (not OCCUPIED)
          );
          console.log('✅ Property status updated to RENTED:', offer.propertyId);
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

        // Get the primary tenant from the tenant group
        const primaryMember = offer?.rentalRequest?.tenantGroup?.members?.[0];
        const tenant = primaryMember?.user;

        // Send payment success notification to landlord
        if (offer?.landlord?.email) {
          console.log('📧 Sending payment success notification to landlord');
          const paymentDescription = metadata.purpose === 'DEPOSIT_AND_FIRST_MONTH' 
            ? 'Deposit and First Month Rent' 
            : 'Rent Payment';
          await sendPaymentSuccess(
            offer.landlord.email,
            offer.landlord.name,
            tenant?.name || 'Tenant',
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

    // 🏆 TRIGGER FIRST REVIEW STAGE: After payment completion
    if (rentalRequestId && metadata.tenantId) {
      try {
        console.log('🎯 Triggering first review stage for payment completion');
        
        // Find the lease associated with this rental request
        const lease = await prisma.lease.findFirst({
          where: { 
            rentalRequestId: parseInt(rentalRequestId),
            tenantId: metadata.tenantId
          }
        });

        if (lease) {
          await reviewService.triggerReviewByEvent('PAYMENT_COMPLETED', lease.id, metadata.tenantId);
          console.log('✅ First review stage triggered for lease:', lease.id);
        } else {
          console.log('⚠️ No lease found for rental request:', rentalRequestId);
        }
      } catch (reviewError) {
        console.error('❌ Error triggering review stage:', reviewError);
        // Don't fail the payment if review trigger fails
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

    // For monthly rent payments, pass additional data needed for completion
    if (purpose === 'MONTHLY_RENT') {
      const { selectedPayments } = req.body;
      
      res.json({
        paymentId: mockPaymentId,
        paymentGateway: 'PAYU',
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/mock-payment?paymentId=${mockPaymentId}&amount=${amount}&gateway=PAYU&offerId=${offerId}&selectedPayments=${encodeURIComponent(JSON.stringify(selectedPayments))}`,
        message: 'PayU payment integration coming soon'
      });
    } else {
      res.json({
        paymentId: mockPaymentId,
        paymentGateway: 'PAYU',
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/mock-payment?paymentId=${mockPaymentId}&amount=${amount}&gateway=PAYU`,
        message: 'PayU payment integration coming soon'
      });
    }
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

    // For monthly rent payments, pass additional data needed for completion
    if (purpose === 'MONTHLY_RENT') {
      const { selectedPayments } = req.body;
      
      res.json({
        paymentId: mockPaymentId,
        paymentGateway: 'P24',
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/mock-payment?paymentId=${mockPaymentId}&amount=${amount}&gateway=P24&offerId=${offerId}&selectedPayments=${encodeURIComponent(JSON.stringify(selectedPayments))}`,
        message: 'Przelewy24 payment integration coming soon'
      });
    } else {
      res.json({
        paymentId: mockPaymentId,
        paymentGateway: 'P24',
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/mock-payment?paymentId=${mockPaymentId}&amount=${amount}&gateway=P24`,
        message: 'Przelewy24 payment integration coming soon'
      });
    }
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

    // For monthly rent payments, pass additional data needed for completion
    if (purpose === 'MONTHLY_RENT') {
      const { selectedPayments } = req.body;
      
      res.json({
        paymentId: mockPaymentId,
        paymentGateway: 'TPAY',
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/mock-payment?paymentId=${mockPaymentId}&amount=${amount}&gateway=TPAY&offerId=${offerId}&selectedPayments=${encodeURIComponent(JSON.stringify(selectedPayments))}`,
        message: 'Tpay payment integration coming soon'
      });
    } else {
      res.json({
        paymentId: mockPaymentId,
        paymentGateway: 'TPAY',
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/mock-payment?paymentId=${mockPaymentId}&amount=${amount}&gateway=TPAY`,
        message: 'Tpay payment integration coming soon'
      });
    }
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
  getMyPayments,
  completeMockPayment
}; 

// ===== Refunds =====
/**
 * Refund all booking-related payments for an offer (Stripe or Mock).
 * Idempotent: safely skips already-cancelled payments.
 */
export const refundOfferPayments = async (offerId) => {
  // Load identifiers
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, rentalRequestId: true, tenantId: true, landlordId: true }
  });
  if (!offer) return { success: false, message: 'Offer not found' };

  const payments = await prisma.payment.findMany({
    where: {
      status: 'SUCCEEDED',
      OR: [ { offerId }, { rentalRequestId: offer.rentalRequestId } ]
    }
  });

  const results = [];
  const { getRefundProvider } = await import('../services/refundProviders/index.js');
  for (const p of payments) {
    try {
      if (p.status !== 'SUCCEEDED') { results.push({ id: p.id, skipped: true }); continue; }
      const provider = getRefundProvider(p.gateway || (p.stripePaymentIntentId ? 'STRIPE' : 'MOCK'));
      const outcome = await provider.refund(p, prisma);
      results.push({ id: p.id, ...outcome });
    } catch (e) {
      results.push({ id: p.id, error: e.message });
    }
  }

  // Create a summary notification to tenant and landlord
  try {
    const summary = `Refunds processed for ${results.length} payment(s).`;
    if (offer.tenantId) {
      const notif = await prisma.notification.create({
        data: {
          userId: offer.tenantId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: offerId,
          title: 'Refund processed',
          body: summary
        }
      });
      // Best-effort realtime emit (if available)
      try {
        const { default: createIO } = await import('../socket/socketServer.js');
        const io = createIO?.io || global.io;
        if (io?.emitNotification) await io.emitNotification(offer.tenantId, notif);
      } catch {}
    }
    if (offer.landlordId) {
      const notif = await prisma.notification.create({
        data: {
          userId: offer.landlordId,
          type: 'SYSTEM_ANNOUNCEMENT',
          entityId: offerId,
          title: 'Refund processed',
          body: summary
        }
      });
      try {
        const { default: createIO } = await import('../socket/socketServer.js');
        const io = createIO?.io || global.io;
        if (io?.emitNotification) await io.emitNotification(offer.landlordId, notif);
      } catch {}
    }
  } catch {}

  return { success: true, results };
};