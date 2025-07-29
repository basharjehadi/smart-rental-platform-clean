import prisma from '../lib/prisma.js';
import { 
  sendRentReminder, 
  sendPaymentSuccess, 
  sendOverdueWarning, 
  sendRentalLocked 
} from '../utils/emailService.js';

// Daily cron job for rent management
const dailyRentCheck = async () => {
  try {
    console.log('🕐 Starting daily rent check...');
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    // Get all accepted offers with active leases
    const activeOffers = await prisma.offer.findMany({
      where: {
        status: {
          in: ['ACCEPTED', 'PAID']
        },
        leaseStartDate: {
          lte: today
        },
        leaseEndDate: {
          gte: today
        }
      },
      include: {
        rentalRequest: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rentPayments: {
          where: {
            month: currentMonth,
            year: currentYear
          }
        }
      }
    });

    console.log(`📊 Found ${activeOffers.length} active offers to process`);

    for (const offer of activeOffers) {
      await processRentPayment(offer, currentMonth, currentYear, today);
    }

    console.log('✅ Daily rent check completed successfully');
  } catch (error) {
    console.error('❌ Daily rent check failed:', error);
  }
};

// Process rent payment for a single offer
const processRentPayment = async (offer, currentMonth, currentYear, today) => {
  try {
    const { rentalRequest, landlord, rentPayments } = offer;
    const tenant = rentalRequest.tenant;
    
    // Check if payment already exists for current month
    const existingPayment = rentPayments[0];
    
    if (!existingPayment) {
      // Create new pending payment
      const dueDate = new Date(today.getFullYear(), today.getMonth(), 5); // Due on 5th of month
      
      const newPayment = await prisma.rentPayment.create({
        data: {
          amount: offer.rentAmount,
          status: 'PENDING',
          dueDate: dueDate,
          month: currentMonth,
          year: currentYear,
          offerId: offer.id,
          tenantId: tenant.id
        }
      });

      console.log(`💰 Created pending payment for ${tenant.name}: ${offer.rentAmount} PLN`);

      // Send reminder email 3 days before due date
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 3 && daysUntilDue > 0) {
        console.log(`📧 Sending rent reminder to ${tenant.name} (${daysUntilDue} days until due)`);
        await sendRentReminder(
          tenant.email,
          tenant.name,
          rentalRequest.title,
          dueDate.toLocaleDateString(),
          offer.rentAmount
        );
      }
    } else {
      // Check for overdue payments
      const daysOverdue = Math.ceil((today - new Date(existingPayment.dueDate)) / (1000 * 60 * 60 * 24));
      
      if (existingPayment.status === 'PENDING' && daysOverdue > 0) {
        console.log(`⚠️ Payment overdue for ${tenant.name}: ${daysOverdue} days`);
        
        // Send overdue warning after 5 days
        if (daysOverdue >= 5 && daysOverdue <= 7) {
          console.log(`📧 Sending overdue warning to ${tenant.name}`);
          await sendOverdueWarning(
            tenant.email,
            tenant.name,
            rentalRequest.title,
            daysOverdue,
            existingPayment.amount
          );
        }
        
        // Lock rental after 5 days overdue
        if (daysOverdue >= 5) {
          console.log(`🔒 Locking rental for ${tenant.name} (${daysOverdue} days overdue)`);
          await lockRentalRequest(rentalRequest.id);
          
          // Send locked notification
          if (daysOverdue === 5) {
            console.log(`📧 Sending rental locked notification to ${tenant.name}`);
            await sendRentalLocked(
              tenant.email,
              tenant.name,
              rentalRequest.title,
              daysOverdue,
              existingPayment.amount
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing rent payment:', error);
  }
};

// Lock rental request
const lockRentalRequest = async (rentalRequestId) => {
  try {
    await prisma.rentalRequest.update({
      where: { id: rentalRequestId },
      data: {
        status: 'LOCKED',
        isLocked: true
      }
    });
    
    console.log(`🔒 Locked rental request: ${rentalRequestId}`);
  } catch (error) {
    console.error('❌ Error locking rental request:', error);
  }
};

// Initialize lease dates when offer is accepted
const initializeLeaseDates = async (offerId) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        rentalRequest: true
      }
    });

    if (!offer) {
      console.error('❌ Offer not found for lease initialization');
      return;
    }

    // Set lease start date to 1 month from now
    const leaseStartDate = new Date();
    leaseStartDate.setMonth(leaseStartDate.getMonth() + 1);
    leaseStartDate.setDate(1); // Start on 1st of month

    // Set lease end date to 12 months from start
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1);
    leaseEndDate.setDate(leaseEndDate.getDate() - 1); // End on last day of previous month

    await prisma.offer.update({
      where: { id: offerId },
      data: {
        leaseStartDate: leaseStartDate,
        leaseEndDate: leaseEndDate
      }
    });

    console.log(`📅 Initialized lease dates for offer: ${offerId}`);
  } catch (error) {
    console.error('❌ Error initializing lease dates:', error);
  }
};

// Get rent payment status for an offer
const getRentPaymentStatus = async (offerId) => {
  try {
    const payments = await prisma.rentPayment.findMany({
      where: { offerId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });
    
    return payments;
  } catch (error) {
    console.error('❌ Error getting rent payment status:', error);
    return [];
  }
};

// Mark rent payment as paid and send notification
const markRentPaymentAsPaid = async (rentPaymentId) => {
  try {
    const payment = await prisma.rentPayment.update({
      where: { id: rentPaymentId },
      data: {
        status: 'SUCCEEDED',
        paidDate: new Date()
      },
      include: {
        offer: {
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
        }
      }
    });

    console.log(`✅ Marked payment as paid: ${rentPaymentId}`);

    // Send payment success notification to landlord
    if (payment.offer.landlord?.email) {
      console.log(`📧 Sending payment success notification to landlord: ${payment.offer.landlord.name}`);
      await sendPaymentSuccess(
        payment.offer.landlord.email,
        payment.offer.landlord.name,
        payment.offer.rentalRequest.tenant.name,
        payment.offer.rentalRequest.title,
        payment.amount,
        new Date().toLocaleDateString()
      );
    }

    // Unlock rental if it was locked
    if (payment.offer.rentalRequest.isLocked) {
      await prisma.rentalRequest.update({
        where: { id: payment.offer.rentalRequest.id },
        data: {
          status: 'ACTIVE',
          isLocked: false
        }
      });
      
      console.log(`🔓 Unlocked rental request: ${payment.offer.rentalRequest.id}`);
    }

    return payment;
  } catch (error) {
    console.error('❌ Error marking payment as paid:', error);
    throw error;
  }
};

export {
  dailyRentCheck,
  initializeLeaseDates,
  getRentPaymentStatus,
  markRentPaymentAsPaid
}; 