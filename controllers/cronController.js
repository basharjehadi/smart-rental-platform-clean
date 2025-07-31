import prisma from '../lib/prisma.js';
import requestPoolService from '../services/requestPoolService.js';

// 🚀 SCALABILITY: Enhanced daily rent check with capacity management
export const dailyRentCheck = async () => {
  try {
    console.log('⏰ Starting daily rent check...');
    const startTime = Date.now();

    // Get all active rent payments
    const activePayments = await prisma.rentPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${activePayments.length} overdue payments`);

    // Process payments in batches for scalability
    const batchSize = 50;
    for (let i = 0; i < activePayments.length; i += batchSize) {
      const batch = activePayments.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (payment) => {
        try {
          // Calculate late fees
          const daysLate = Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          const lateFee = daysLate * (payment.amount * 0.05); // 5% per day

          // Update payment status
          await prisma.rentPayment.update({
            where: { id: payment.id },
            data: {
              isOverdue: true,
              lateFee: lateFee,
              status: 'PENDING' // Keep as pending for manual review
            }
          });

          console.log(`💰 Updated payment ${payment.id} with late fee: ${lateFee}`);
        } catch (error) {
          console.error(`❌ Error processing payment ${payment.id}:`, error);
        }
      }));
    }

    // 🚀 SCALABILITY: Cleanup expired requests from pool
    await requestPoolService.cleanupExpiredRequests();

    // 🚀 SCALABILITY: Update landlord availability based on capacity
    await updateLandlordAvailability();

    const endTime = Date.now();
    console.log(`✅ Daily rent check completed in ${endTime - startTime}ms`);
  } catch (error) {
    console.error('❌ Error in daily rent check:', error);
  }
};

// 🚀 SCALABILITY: Update landlord availability based on capacity
const updateLandlordAvailability = async () => {
  try {
    console.log('🔄 Updating landlord availability...');

    // Find landlords who should be marked as unavailable
    const overCapacityLandlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD',
        availability: true,
        activeContracts: {
          gte: prisma.user.fields.totalCapacity
        }
      },
      select: {
        id: true,
        name: true,
        activeContracts: true,
        totalCapacity: true
      }
    });

    // Mark over-capacity landlords as unavailable
    if (overCapacityLandlords.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: overCapacityLandlords.map(l => l.id)
          }
        },
        data: {
          availability: false
        }
      });

      console.log(`🚫 Marked ${overCapacityLandlords.length} landlords as unavailable due to capacity limits`);
    }

    // Find landlords who can be marked as available again
    const underCapacityLandlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD',
        availability: false,
        activeContracts: {
          lt: prisma.user.fields.totalCapacity
        }
      },
      select: {
        id: true,
        name: true,
        activeContracts: true,
        totalCapacity: true
      }
    });

    // Mark under-capacity landlords as available
    if (underCapacityLandlords.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: underCapacityLandlords.map(l => l.id)
          }
        },
        data: {
          availability: true
        }
      });

      console.log(`✅ Marked ${underCapacityLandlords.length} landlords as available again`);
    }

  } catch (error) {
    console.error('❌ Error updating landlord availability:', error);
  }
};

// 🚀 SCALABILITY: Initialize lease dates for accepted offers
export const initializeLeaseDates = async (offerId) => {
  try {
    console.log(`📅 Initializing lease dates for offer ${offerId}`);

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    // Calculate lease start and end dates
    const leaseStartDate = new Date(offer.availableFrom);
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + offer.leaseDuration);

    // Update offer with lease dates
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        leaseStartDate: leaseStartDate,
        leaseEndDate: leaseEndDate
      }
    });

    // 🚀 SCALABILITY: Create rent payment records for the lease duration
    await createRentPayments(offerId, leaseStartDate, leaseEndDate, offer.rentAmount);

    console.log(`✅ Lease dates initialized for offer ${offerId}`);
  } catch (error) {
    console.error('❌ Error initializing lease dates:', error);
    throw error;
  }
};

// 🚀 SCALABILITY: Create rent payment records for lease duration
const createRentPayments = async (offerId, leaseStartDate, leaseEndDate, rentAmount) => {
  try {
    const payments = [];
    const currentDate = new Date(leaseStartDate);
    
    while (currentDate < leaseEndDate) {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const dueDate = new Date(currentDate);
      dueDate.setDate(dueDate.getDate() + 1); // Due on 1st of each month

      payments.push({
        amount: rentAmount,
        status: 'PENDING',
        dueDate: dueDate,
        month: month,
        year: year,
        isOverdue: false,
        lateFee: 0,
        gracePeriod: 5
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 🚀 SCALABILITY: Batch insert payments for performance
    if (payments.length > 0) {
      await prisma.rentPayment.createMany({
        data: payments.map(payment => ({
          ...payment,
          offerId: offerId
        }))
      });

      console.log(`💰 Created ${payments.length} rent payment records for offer ${offerId}`);
    }
  } catch (error) {
    console.error('❌ Error creating rent payments:', error);
    throw error;
  }
};

// 🚀 SCALABILITY: Weekly analytics update
export const weeklyAnalyticsUpdate = async () => {
  try {
    console.log('📊 Starting weekly analytics update...');

    // Update request pool analytics for all locations
    const locations = await prisma.rentalRequest.groupBy({
      by: ['location'],
      _count: {
        location: true
      }
    });

    for (const location of locations) {
      await requestPoolService.updatePoolAnalytics(location.location);
    }

    // Update landlord performance metrics
    await updateLandlordPerformanceMetrics();

    console.log('✅ Weekly analytics update completed');
  } catch (error) {
    console.error('❌ Error in weekly analytics update:', error);
  }
};

// 🚀 SCALABILITY: Update landlord performance metrics
const updateLandlordPerformanceMetrics = async () => {
  try {
    const landlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD'
      },
      include: {
        offers: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          select: {
            id: true,
            status: true,
            responseTime: true,
            createdAt: true
          }
        }
      }
    });

    for (const landlord of landlords) {
      const acceptedOffers = landlord.offers.filter(o => o.status === 'ACCEPTED');
      const totalOffers = landlord.offers.length;
      
      const acceptanceRate = totalOffers > 0 ? acceptedOffers.length / totalOffers : 0;
      const averageResponseTime = landlord.offers.length > 0 
        ? landlord.offers.reduce((sum, o) => sum + (o.responseTime || 0), 0) / landlord.offers.length 
        : null;

      await prisma.landlordProfile.update({
        where: { userId: landlord.id },
        data: {
          acceptanceRate: acceptanceRate,
          averageResponseTime: averageResponseTime
        }
      });
    }

    console.log(`📈 Updated performance metrics for ${landlords.length} landlords`);
  } catch (error) {
    console.error('❌ Error updating landlord performance metrics:', error);
  }
};

// 🚀 SCALABILITY: Monthly cleanup and maintenance
export const monthlyCleanup = async () => {
  try {
    console.log('🧹 Starting monthly cleanup...');

    // Archive old analytics data (keep last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    await prisma.requestPoolAnalytics.deleteMany({
      where: {
        date: {
          lt: twelveMonthsAgo
        }
      }
    });

    // Clean up old matches (keep last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await prisma.landlordRequestMatch.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        },
        isViewed: true,
        isResponded: true
      }
    });

    console.log('✅ Monthly cleanup completed');
  } catch (error) {
    console.error('❌ Error in monthly cleanup:', error);
  }
}; 