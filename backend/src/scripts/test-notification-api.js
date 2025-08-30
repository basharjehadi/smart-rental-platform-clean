import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotificationAPI() {
  try {
    console.log('🧪 Testing Notification API endpoints...\n');

    const landlordId = 'cme4x3r180001exy8spbxmarn';

    // Test 1: Check unread counts
    console.log('1️⃣ Testing unread counts...');
    const unreadCounts = await prisma.notification.count({
      where: {
        userId: landlordId,
        isRead: false,
      },
    });

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

    console.log(`   ✅ Unread total: ${unreadCounts}`);
    console.log(`   ✅ Rental Requests: ${rentalRequestCount}`);
    console.log(`   ✅ Offers: ${offerCount}`);

    // Test 2: Check all notifications
    console.log('\n2️⃣ Testing all notifications...');
    const allNotifications = await prisma.notification.findMany({
      where: { userId: landlordId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log(`   ✅ Found ${allNotifications.length} notifications:`);
    allNotifications.forEach((notif, index) => {
      console.log(
        `      ${index + 1}. ${notif.title} (${notif.type}) - Read: ${notif.isRead}`
      );
    });

    // Test 3: Check specific notification
    console.log('\n3️⃣ Testing specific notification...');
    const specificNotification = await prisma.notification.findFirst({
      where: {
        userId: landlordId,
        type: 'NEW_RENTAL_REQUEST',
      },
    });

    if (specificNotification) {
      console.log(`   ✅ Found notification: ${specificNotification.title}`);
      console.log(`      - ID: ${specificNotification.id}`);
      console.log(`      - Type: ${specificNotification.type}`);
      console.log(`      - Is Read: ${specificNotification.isRead}`);
      console.log(`      - Created: ${specificNotification.createdAt}`);
    } else {
      console.log('   ❌ No rental request notifications found');
    }

    console.log('\n🎯 API Test Results:');
    if (unreadCounts > 0) {
      console.log('   ✅ Unread notifications exist');
      console.log('   ✅ Frontend should display notification badge');
      console.log('   ✅ Toast notifications should appear');
    } else {
      console.log('   ❌ No unread notifications found');
      console.log("   ❌ Frontend won't show any notifications");
    }
  } catch (error) {
    console.error('❌ Error testing notification API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationAPI();
