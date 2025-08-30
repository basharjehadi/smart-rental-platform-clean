import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetMatching() {
  try {
    console.log('🔄 Resetting matching data to test updated logic...\n');

    // Remove existing matches
    const deletedMatches = await prisma.landlordRequestMatch.deleteMany({
      where: { rentalRequestId: 1 },
    });
    console.log(`🗑️ Deleted ${deletedMatches.count} existing matches`);

    // Remove existing notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        userId: 'cme4x3r180001exy8spbxmarn',
        type: 'NEW_RENTAL_REQUEST',
      },
    });
    console.log(
      `🗑️ Deleted ${deletedNotifications.count} existing notifications`
    );

    // Reset rental request pool status
    await prisma.rentalRequest.update({
      where: { id: 1 },
      data: { poolStatus: 'ACTIVE' },
    });
    console.log('✅ Reset rental request pool status to ACTIVE');

    console.log('\n🎯 Ready to test updated matching logic!');
    console.log('   Run: node check-pool-status.js');
  } catch (error) {
    console.error('❌ Error resetting matching:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetMatching();
