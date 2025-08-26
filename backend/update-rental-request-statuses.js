const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRentalRequestStatuses() {
  try {
    console.log('🔄 Starting rental request status updates...');

    // Find all rental requests that have accepted or paid offers
    const requestsWithAcceptedOffers = await prisma.rentalRequest.findMany({
      where: {
        offers: {
          some: {
            status: { in: ['ACCEPTED', 'PAID'] }
          }
        },
        status: {
          not: 'LOCKED'
        }
      },
      include: {
        offers: {
          where: {
            status: { in: ['ACCEPTED', 'PAID'] }
          }
        }
      }
    });

    console.log(`📊 Found ${requestsWithAcceptedOffers.length} rental requests with accepted/paid offers`);

    if (requestsWithAcceptedOffers.length > 0) {
      // Update these requests to LOCKED status
      const updatePromises = requestsWithAcceptedOffers.map(request => {
        console.log(`🔒 Updating request ${request.id} (${request.title}) to LOCKED status`);
        console.log(`   - Current status: ${request.status}`);
        console.log(`   - Offers: ${request.offers.map(o => `${o.status} (ID: ${o.id})`).join(', ')}`);
        
        return prisma.rentalRequest.update({
          where: { id: request.id },
          data: {
            status: 'LOCKED',
            poolStatus: 'MATCHED'
          }
        });
      });

      await Promise.all(updatePromises);
      console.log('✅ Successfully updated all rental request statuses');
    } else {
      console.log('ℹ️ No rental requests need status updates');
    }

    // Also update expired requests
    const now = new Date();
    const expiredRequests = await prisma.rentalRequest.findMany({
      where: {
        moveInDate: {
          lt: now
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    console.log(`📅 Found ${expiredRequests.length} expired rental requests`);

    if (expiredRequests.length > 0) {
      const updateExpiredPromises = expiredRequests.map(request => {
        console.log(`⏰ Updating expired request ${request.id} (${request.title}) to CANCELLED status`);
        return prisma.rentalRequest.update({
          where: { id: request.id },
          data: {
            status: 'CANCELLED',
            poolStatus: 'EXPIRED'
          }
        });
      });

      await Promise.all(updateExpiredPromises);
      console.log('✅ Successfully updated all expired rental request statuses');
    }

    console.log('🎉 All rental request status updates completed successfully!');

  } catch (error) {
    console.error('❌ Error updating rental request statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateRentalRequestStatuses();
