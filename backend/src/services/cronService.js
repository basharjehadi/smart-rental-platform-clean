import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';

// Check if rent has been paid for the current month
const hasRentPaidForCurrentMonth = async (rentalRequestId, currentDate) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const rentPayment = await prisma.payment.findFirst({
    where: {
      rentalRequestId: rentalRequestId,
      purpose: 'RENT',
      status: 'SUCCEEDED',
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  return !!rentPayment;
};

// Daily cron job to check rental requests
const checkRentalRequestsDaily = async () => {
  try {
    console.log('🕐 Running daily rental request check...');
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    // Only run if it's after the 10th of the month
    if (currentDay <= 10) {
      console.log('📅 Too early in month, skipping check (before 10th)');
      return;
    }

    // Get all active rental requests with accepted offers
    const activeRequests = await prisma.rentalRequest.findMany({
      where: {
        status: 'ACTIVE',
        isLocked: false,
        offer: {
          status: 'ACCEPTED'
        }
      },
      include: {
        offer: true
      }
    });

    console.log(`📋 Found ${activeRequests.length} active requests with accepted offers`);

    let lockedCount = 0;

    for (const request of activeRequests) {
      const hasRentPaid = await hasRentPaidForCurrentMonth(request.id, currentDate);

      if (!hasRentPaid) {
        // Lock the rental request
        await prisma.rentalRequest.update({
          where: { id: request.id },
          data: { isLocked: true }
        });

        console.log(`🔒 Locked rental request: ${request.id} (${request.title}) - No rent paid for ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
        lockedCount++;
      }
    }

    console.log(`✅ Daily check completed. Locked ${lockedCount} rental requests.`);
  } catch (error) {
    console.error('❌ Error in daily rental request check:', error);
  }
};

// Initialize cron jobs
const initializeCronJobs = () => {
  // Run daily at 00:00 (midnight)
  cron.schedule('0 0 * * *', checkRentalRequestsDaily, {
    scheduled: true,
    timezone: "Europe/Warsaw" // Polish timezone
  });

  console.log('⏰ Daily rental request check scheduled for 00:00 (Warsaw time)');
};

// Manual trigger for testing
const triggerDailyCheck = async () => {
  console.log('🔧 Manually triggering daily check...');
  await checkRentalRequestsDaily();
};

export {
  initializeCronJobs,
  checkRentalRequestsDaily,
  triggerDailyCheck
}; 