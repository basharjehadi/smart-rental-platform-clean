import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOfferDates() {
  try {
    console.log('🔧 Fixing corrupted offer dates...');

    // Find all offers - we'll check for invalid dates
    const allOffers = await prisma.offer.findMany({
      include: {
        rentalRequest: {
          select: {
            id: true,
            moveInDate: true,
          },
        },
      },
    });

    // Filter offers with problematic dates
    const offersWithNullDates = allOffers.filter(offer => {
      return !offer.availableFrom || 
             offer.availableFrom.toString() === 'Invalid Date' ||
             offer.availableFrom < new Date('2020-01-01'); // Very old dates
    });

    console.log(`📊 Found ${offersWithNullDates.length} offers with null availableFrom`);

    if (offersWithNullDates.length === 0) {
      console.log('✅ All offers have valid dates');
      return;
    }

    // Fix each offer
    for (const offer of offersWithNullDates) {
      console.log(`🔧 Fixing offer ${offer.id}...`);
      
      let newAvailableFrom;
      
      if (offer.rentalRequest?.moveInDate) {
        // Use rental request move-in date
        newAvailableFrom = new Date(offer.rentalRequest.moveInDate);
        console.log(`  📅 Using rental request move-in date: ${newAvailableFrom}`);
      } else {
        // Use current date as fallback
        newAvailableFrom = new Date();
        console.log(`  📅 Using current date as fallback: ${newAvailableFrom}`);
      }

      // Update the offer
      await prisma.offer.update({
        where: { id: offer.id },
        data: { availableFrom: newAvailableFrom },
      });

      console.log(`  ✅ Updated offer ${offer.id} with availableFrom: ${newAvailableFrom}`);
    }

    console.log('🎉 All offer dates fixed successfully!');

    // Verify the fix
    const remainingNullDates = await prisma.offer.count({
      where: { availableFrom: null },
    });

    console.log(`🔍 Verification: ${remainingNullDates} offers still have null availableFrom`);

  } catch (error) {
    console.error('❌ Error fixing offer dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixOfferDates();
