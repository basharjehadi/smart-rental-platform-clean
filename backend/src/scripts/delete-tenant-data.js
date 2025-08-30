import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTenantData() {
  console.log(
    '🗑️ Deleting all rental requests and offers for tenant@test.com...'
  );

  try {
    // Find the tenant
    const tenant = await prisma.user.findUnique({
      where: { email: 'tenant@test.com' },
    });

    if (!tenant) {
      console.log('❌ Tenant not found');
      return;
    }

    console.log('✅ Found tenant:', tenant.email);

    // First, find all rental requests for this tenant
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: { tenantId: tenant.id },
      include: {
        offers: true,
        payments: true,
      },
    });

    console.log(`📋 Found ${rentalRequests.length} rental requests`);

    if (rentalRequests.length === 0) {
      console.log('✅ No rental requests to delete');
      return;
    }

    // Delete payments first (they reference offers)
    let deletedPayments = 0;
    for (const request of rentalRequests) {
      for (const offer of request.offers) {
        const payments = await prisma.payment.deleteMany({
          where: { offerId: offer.id },
        });
        deletedPayments += payments.count;
      }
    }
    console.log(`💰 Deleted ${deletedPayments} payments`);

    // Delete offers
    let deletedOffers = 0;
    for (const request of rentalRequests) {
      const offers = await prisma.offer.deleteMany({
        where: { rentalRequestId: request.id },
      });
      deletedOffers += offers.count;
    }
    console.log(`📝 Deleted ${deletedOffers} offers`);

    // Delete rental requests
    const deletedRequests = await prisma.rentalRequest.deleteMany({
      where: { tenantId: tenant.id },
    });
    console.log(`🏠 Deleted ${deletedRequests.count} rental requests`);

    console.log('🎉 Successfully deleted all tenant data!');
    console.log('\n📋 Summary:');
    console.log('========================');
    console.log(`💰 Payments deleted: ${deletedPayments}`);
    console.log(`📝 Offers deleted: ${deletedOffers}`);
    console.log(`🏠 Rental requests deleted: ${deletedRequests.count}`);
    console.log('');
    console.log(
      '🔗 Now when you login as tenant@test.com, you should see the empty state in the dashboard!'
    );
  } catch (error) {
    console.error('❌ Error deleting tenant data:', error);
    console.error('Error details:', error.message);
  }
}

deleteTenantData()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
