import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRentalRequest() {
  try {
    console.log('🔧 Fixing rental request data...\n');

    // Get the existing rental request
    const rentalRequest = await prisma.rentalRequest.findFirst();
    
    if (!rentalRequest) {
      console.log('❌ No rental request found');
      return;
    }

    console.log('📝 Current rental request:');
    console.log(`  - ID: ${rentalRequest.id}`);
    console.log(`  - Title: "${rentalRequest.title}"`);
    console.log(`  - Location: ${rentalRequest.location}`);
    console.log(`  - City: ${rentalRequest.city || 'NULL'}`);
    console.log(`  - Budget: ${rentalRequest.budget} PLN`);
    console.log(`  - Budget From: ${rentalRequest.budgetFrom || 'NULL'}`);
    console.log(`  - Budget To: ${rentalRequest.budgetTo || 'NULL'}`);

    // Fix the city field by extracting it from location
    const city = rentalRequest.city || rentalRequest.location.split(',')[1]?.trim() || rentalRequest.location.trim();
    
    if (!rentalRequest.city) {
      console.log(`\n🔧 Updating city field to: "${city}"`);
      
      await prisma.rentalRequest.update({
        where: { id: rentalRequest.id },
        data: { city }
      });
      
      console.log('✅ City field updated successfully');
    } else {
      console.log('✅ City field already exists');
    }

    // Now test the matching logic with the fixed data
    console.log('\n🔍 Testing matching logic with fixed data...');
    
    const { default: requestPoolService } = await import('./src/services/requestPoolService.js');
    
    // Get the updated rental request
    const updatedRequest = await prisma.rentalRequest.findFirst({
      include: {
        tenant: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log('📝 Updated rental request:');
    console.log(`  - City: ${updatedRequest.city}`);
    console.log(`  - Location: ${updatedRequest.location}`);
    console.log(`  - Budget: ${updatedRequest.budget} PLN`);
    console.log(`  - Budget From: ${updatedRequest.budgetFrom}`);
    console.log(`  - Budget To: ${updatedRequest.budgetTo}`);

    // Test adding to pool
    console.log('\n🏊 Testing addToPool with fixed data...');
    const matchCount = await requestPoolService.addToPool(updatedRequest);
    console.log(`✅ Added to pool with ${matchCount} matches`);

    // Check if matches were created
    const matches = await prisma.landlordRequestMatch.findMany({
      where: { rentalRequestId: updatedRequest.id }
    });
    console.log(`🔍 Matches created: ${matches.length}`);

    if (matches.length > 0) {
      console.log('\n🔗 Matches details:');
      matches.forEach(match => {
        console.log(`  - Landlord ID: ${match.landlordId}`);
        console.log(`    Match Score: ${match.matchScore}`);
        console.log(`    Match Reason: ${match.matchReason}`);
      });

      // Check if notifications were created
      const notifications = await prisma.notification.findMany({
        where: {
          type: 'NEW_RENTAL_REQUEST',
          entityId: updatedRequest.id.toString()
        }
      });
      console.log(`🔔 Notifications created: ${notifications.length}`);

      if (notifications.length > 0) {
        console.log('\n🔔 Notification details:');
        notifications.forEach(notification => {
          console.log(`  - User ID: ${notification.userId}`);
          console.log(`    Title: ${notification.title}`);
          console.log(`    Body: ${notification.body}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRentalRequest();

