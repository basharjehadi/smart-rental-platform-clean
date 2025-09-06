import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setRenewalLifecycle() {
  try {
    console.log('🔄 Setting up renewal lifecycle test scenario');
    console.log('==========================================');
    console.log('Simulating today as September 11, 2026');
    console.log('Original lease: Sep 10, 2025 - Sep 10, 2026 (EXPIRED)');
    console.log('Renewal lease: Sep 10, 2026 - Sep 10, 2027 (ACTIVE)');
    console.log('');

    // Find the current offer
    const offer = await prisma.offer.findFirst({
      where: { status: 'PAID' }
    });

    if (!offer) {
      console.log('❌ No PAID offer found');
      return;
    }

    console.log(`📋 Found offer: ${offer.id}`);

    // 1. Create original lease (expired)
    const originalLeaseStart = new Date('2025-09-10');
    const originalLeaseEnd = new Date('2026-09-10');
    
    const originalLease = await prisma.lease.create({
      data: {
        offerId: offer.id,
        rentalRequestId: offer.rentalRequestId,
        startDate: originalLeaseStart,
        endDate: originalLeaseEnd,
        rentAmount: offer.rentAmount,
        depositAmount: offer.depositAmount,
        status: 'EXPIRED',
        leaseType: 'ORIGINAL',
        organizationId: offer.organizationId,
        tenantGroupId: offer.rentalRequest.tenantGroupId
      }
    });

    console.log('✅ Created original lease (EXPIRED):');
    console.log(`   ID: ${originalLease.id}`);
    console.log(`   Period: ${originalLeaseStart.toISOString().split('T')[0]} - ${originalLeaseEnd.toISOString().split('T')[0]}`);

    // 2. Create renewal lease (active)
    const renewalLeaseStart = new Date('2026-09-10');
    const renewalLeaseEnd = new Date('2027-09-10');
    
    const renewalLease = await prisma.lease.create({
      data: {
        offerId: offer.id,
        rentalRequestId: offer.rentalRequestId,
        startDate: renewalLeaseStart,
        endDate: renewalLeaseEnd,
        rentAmount: offer.rentAmount,
        depositAmount: offer.depositAmount,
        status: 'ACTIVE',
        leaseType: 'RENEWAL',
        parentLeaseId: originalLease.id,
        organizationId: offer.organizationId,
        tenantGroupId: offer.rentalRequest.tenantGroupId
      }
    });

    console.log('✅ Created renewal lease (ACTIVE):');
    console.log(`   ID: ${renewalLease.id}`);
    console.log(`   Period: ${renewalLeaseStart.toISOString().split('T')[0]} - ${renewalLeaseEnd.toISOString().split('T')[0]}`);

    // 3. Create renewal request (accepted)
    const renewalRequest = await prisma.renewalRequest.create({
      data: {
        leaseId: originalLease.id,
        requestedBy: offer.rentalRequest.tenantGroup.members[0].userId,
        status: 'ACCEPTED',
        proposedStartDate: renewalLeaseStart,
        proposedTermMonths: 12,
        proposedMonthlyRent: offer.rentAmount,
        acceptedAt: new Date('2026-08-15'),
        acceptedBy: offer.rentalRequest.tenantGroup.members[0].userId
      }
    });

    console.log('✅ Created renewal request (ACCEPTED):');
    console.log(`   ID: ${renewalRequest.id}`);

    // 4. Create renewal contract
    const renewalContract = await prisma.contract.create({
      data: {
        leaseId: renewalLease.id,
        contractType: 'RENEWAL',
        pdfUrl: '/contracts/renewal-test.pdf',
        generatedAt: new Date('2026-08-15')
      }
    });

    console.log('✅ Created renewal contract:');
    console.log(`   ID: ${renewalContract.id}`);

    // 5. Update renewal lease with contract
    await prisma.lease.update({
      where: { id: renewalLease.id },
      data: { contractId: renewalContract.id }
    });

    console.log('');
    console.log('📊 Renewal lifecycle test scenario ready:');
    console.log(`   Simulated today: 2026-09-11`);
    console.log(`   Original lease: EXPIRED (Sep 10, 2025 - Sep 10, 2026)`);
    console.log(`   Renewal lease: ACTIVE (Sep 10, 2026 - Sep 10, 2027)`);
    console.log(`   Renewal request: ACCEPTED`);
    console.log(`   Renewal contract: Generated`);
    console.log('');
    console.log('🎯 Now you can test:');
    console.log('   - Dashboard should show renewal lease data');
    console.log('   - Contract view/download should show renewal contract');
    console.log('   - Lease progress bar should show renewal terms');
    console.log('   - Renewal card should show appropriate messages');

  } catch (error) {
    console.error('❌ Error setting up renewal lifecycle test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setRenewalLifecycle();


