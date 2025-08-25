import { prisma } from '../src/utils/prisma.js';

async function backfillRentalRequestOnPayments() {
  console.log('🔧 Backfilling payment.rentalRequestId from related offer...');
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCEEDED',
        rentalRequestId: null,
        offerId: { not: null }
      },
      select: { id: true, offerId: true, purpose: true }
    });

    console.log(`📦 Found ${payments.length} payments missing rentalRequestId`);

    let updated = 0;
    for (const p of payments) {
      try {
        const offer = await prisma.offer.findUnique({
          where: { id: p.offerId },
          select: { rentalRequestId: true }
        });
        if (offer?.rentalRequestId) {
          await prisma.payment.update({
            where: { id: p.id },
            data: { rentalRequestId: offer.rentalRequestId }
          });
          updated += 1;
          console.log(`✅ Updated payment ${p.id} (${p.purpose}) → rentalRequestId ${offer.rentalRequestId}`);
        } else {
          console.log(`⚠️ Offer not found or missing rentalRequestId for payment ${p.id}`);
        }
      } catch (e) {
        console.error(`❌ Error updating payment ${p.id}:`, e.message);
      }
    }

    console.log(`🏁 Backfill complete. Updated ${updated}/${payments.length} payments.`);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillRentalRequestOnPayments();


