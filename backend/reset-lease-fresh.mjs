import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetLeaseLifecycle() {
  try {
    console.log('🔄 Resetting Lease Lifecycle to Fresh State');
    console.log('==========================================');

    // 1. Delete all leases
    console.log('🗑️  Deleting all leases...');
    const deletedLeases = await prisma.lease.deleteMany({});
    console.log(`   Deleted ${deletedLeases.count} leases`);

    // 2. Delete all contracts
    console.log('🗑️  Deleting all contracts...');
    const deletedContracts = await prisma.contract.deleteMany({});
    console.log(`   Deleted ${deletedContracts.count} contracts`);

    // 3. Delete all renewal requests
    console.log('🗑️  Deleting all renewal requests...');
    const deletedRenewals = await prisma.renewalRequest.deleteMany({});
    console.log(`   Deleted ${deletedRenewals.count} renewal requests`);

    // 4. Reset offers to PAID status
    console.log('🔄 Resetting offers to PAID status...');
    const updatedOffers = await prisma.offer.updateMany({
      where: { status: 'PAID' },
      data: {
        moveInVerificationDate: null,
        verificationNotes: null
      }
    });
    console.log(`   Updated ${updatedOffers.count} offers`);

    // 5. Check current state
    console.log('\n📊 Current State:');
    const offers = await prisma.offer.findMany({
      where: { status: 'PAID' },
      include: { 
        rentalRequest: { 
          include: { 
            tenantGroup: { 
              include: { members: true } 
            } 
          } 
        } 
      }
    });

    console.log(`   Active offers: ${offers.length}`);
    offers.forEach(offer => {
      const tenantName = offer.rentalRequest?.tenantGroup?.members?.[0]?.name || 'Unknown';
      console.log(`   - ${tenantName} (${offer.id})`);
    });

    console.log('\n✅ Lease lifecycle reset complete!');
    console.log('   - All leases, contracts, and renewals deleted');
    console.log('   - Offers reset to fresh PAID state');
    console.log('   - Ready for new lease lifecycle testing');

  } catch (error) {
    console.error('❌ Error resetting lease lifecycle:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLeaseLifecycle();


