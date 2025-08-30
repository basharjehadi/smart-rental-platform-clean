import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetNotification() {
  try {
    console.log('🔄 Resetting notification status...\n');

    // Reset the notification to unread
    const updatedNotification = await prisma.notification.update({
      where: { id: 'cme5ezx1k0002exo0eob0pemo' },
      data: { isRead: false },
    });

    console.log('✅ Notification reset successfully:');
    console.log(`  - ID: ${updatedNotification.id}`);
    console.log(`  - Title: ${updatedNotification.title}`);
    console.log(`  - Is Read: ${updatedNotification.isRead}`);
    console.log(`  - Type: ${updatedNotification.type}`);
    console.log('');

    // Also check the current notification counts
    const landlordId = 'cme4x3r180001exy8spbxmarn';
    const unreadCounts = await prisma.notification.count({
      where: {
        userId: landlordId,
        isRead: false,
      },
    });

    console.log(
      `📊 Current unread notifications for landlord: ${unreadCounts}`
    );

    // Check notification counts by type
    const rentalRequestCount = await prisma.notification.count({
      where: {
        userId: landlordId,
        type: 'NEW_RENTAL_REQUEST',
        isRead: false,
      },
    });

    const offerCount = await prisma.notification.count({
      where: {
        userId: landlordId,
        type: 'NEW_OFFER',
        isRead: false,
      },
    });

    console.log(`  - Rental Requests: ${rentalRequestCount}`);
    console.log(`  - Offers: ${offerCount}`);
    console.log('');

    console.log('🎯 Now you can test the frontend notification display!');
    console.log('   The notification should appear in:');
    console.log('   1. The notification badge on the sidebar');
    console.log('   2. Toast notifications (top-right corner)');
    console.log('   3. The notification dropdown (if implemented)');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetNotification();
