const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOffers() {
  try {
    console.log('🔍 Checking offers in database...');

    const offers = await prisma.offer.findMany({
      include: {
        property: true,
        rentalRequest: true,
      },
    });

    console.log(`\n📊 Found ${offers.length} offers:`);

    offers.forEach((offer, index) => {
      console.log(`\n${index + 1}. Offer ID: ${offer.id}`);
      console.log(`   Status: ${offer.status}`);
      console.log(`   isPaid: ${offer.isPaid}`);
      console.log(`   Property Address: ${offer.property?.address || 'N/A'}`);
      console.log(`   Property District: ${offer.property?.district || 'N/A'}`);
      console.log(`   Property ZipCode: ${offer.property?.zipCode || 'N/A'}`);
      console.log(`   Property City: ${offer.property?.city || 'N/A'}`);
      console.log(
        `   PropertyAddress (from offer): ${offer.propertyAddress || 'N/A'}`
      );
    });

    // Check if any offers are marked as paid
    const paidOffers = offers.filter((offer) => offer.isPaid === true);
    console.log(`\n💰 Paid offers: ${paidOffers.length}`);

    if (paidOffers.length > 0) {
      console.log('\n✅ Paid offers found:');
      paidOffers.forEach((offer) => {
        console.log(`   - Offer ID: ${offer.id}, Status: ${offer.status}`);
      });
    } else {
      console.log("\n❌ No paid offers found. Let's create one for testing...");

      // Find an offer to mark as paid for testing
      const testOffer = offers[0];
      if (testOffer) {
        console.log(
          `\n🔧 Marking offer ${testOffer.id} as paid for testing...`
        );

        await prisma.offer.update({
          where: { id: testOffer.id },
          data: {
            status: 'PAID',
            isPaid: true,
          },
        });

        console.log('✅ Offer marked as paid!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOffers();
