import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    console.log('🔔 Checking notifications...\n');

    // Check notifications for the landlord
    const landlordId = 'cme4x3r180001exy8spbxmarn';
    const notifications = await prisma.notification.findMany({
      where: { userId: landlordId }
    });

    console.log(`📧 Notifications for landlord ${landlordId}: ${notifications.length}`);
    
    notifications.forEach(notification => {
      console.log(`  - ID: ${notification.id}`);
      console.log(`    Title: ${notification.title}`);
      console.log(`    Body: ${notification.body}`);
      console.log(`    Type: ${notification.type}`);
      console.log(`    Entity ID: ${notification.entityId}`);
      console.log(`    Is Read: ${notification.isRead}`);
      console.log(`    Created: ${notification.createdAt}`);
      console.log('');
    });

    // Also check the landlord-request match
    const matches = await prisma.landlordRequestMatch.findMany({
      where: { landlordId: landlordId }
    });

    console.log(`🔗 Landlord-Request Matches: ${matches.length}`);
    
    matches.forEach(match => {
      console.log(`  - Match ID: ${match.id}`);
      console.log(`    Score: ${match.matchScore}`);
      console.log(`    Reason: ${match.matchReason}`);
      console.log(`    Rental Request ID: ${match.rentalRequestId}`);
      console.log(`    Is Viewed: ${match.isViewed}`);
      console.log(`    Is Responded: ${match.isResponded}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();

