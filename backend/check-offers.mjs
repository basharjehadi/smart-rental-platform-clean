import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOfferStatus() {
  try {
    console.log('🔍 Checking offer status in database...');

    const offers = await prisma.offer.findMany({
      include: {
        property: true,
        rentalRequest: true
      }
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
      console.log(`   PropertyAddress (from offer): ${offer.propertyAddress || 'N/A'}`);
    });

    // Check if any offers are marked as paid
    const paidOffers = offers.filter(offer => offer.isPaid === true || offer.status === 'PAID');
    console.log(`\n💰 Paid offers: ${paidOffers.length}`);

    if (paidOffers.length > 0) {
      console.log('\n✅ Paid offers found:');
      paidOffers.forEach(offer => {
        console.log(`   - Offer ID: ${offer.id}, Status: ${offer.status}, isPaid: ${offer.isPaid}`);
      });
    } else {
      console.log('\n❌ No paid offers found.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOfferStatus();
