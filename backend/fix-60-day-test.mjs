import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix60DayTest() {
  try {
    console.log('🔧 Fixing 60-day test - Creating actual lease data');
    console.log('=================================================');

    // Get current offer
    const offer = await prisma.offer.findFirst({
      where: { status: 'PAID' }
    });

    if (!offer) {
      console.log('❌ No PAID offer found');
      return;
    }

    console.log('📋 Found offer:', offer.id);

    // Delete any existing leases first
    await prisma.lease.deleteMany({
      where: { offerId: offer.id }
    });

    // Create the lease with proper dates
    const leaseStartDate = new Date('2025-09-10');
    const leaseEndDate = new Date('2026-09-10');
    
    const lease = await prisma.lease.create({
      data: {
        offerId: offer.id,
        rentalRequestId: offer.rentalRequestId,
        startDate: leaseStartDate,
        endDate: leaseEndDate,
        rentAmount: offer.rentAmount,
        depositAmount: offer.depositAmount,
        status: 'ACTIVE',
        leaseType: 'ORIGINAL',
        organizationId: offer.organizationId,
        tenantGroupId: offer.tenantGroupId,
        unitId: 'cmf6z3j91000mexj0wkuwuq2c' // Real unit ID
      }
    });

    console.log('✅ Created lease:');
    console.log(`   ID: ${lease.id}`);
    console.log(`   Period: ${leaseStartDate.toISOString().split('T')[0]} - ${leaseEndDate.toISOString().split('T')[0]}`);

    // Calculate days until end (simulating July 15, 2026)
    const simulatedToday = new Date('2026-07-15');
    const daysUntilEnd = Math.ceil((leaseEndDate - simulatedToday) / (1000 * 60 * 60 * 24));
    
    console.log('');
    console.log('📊 Test scenario ready:');
    console.log(`   Simulated today: ${simulatedToday.toISOString().split('T')[0]}`);
    console.log(`   Days until lease end: ${daysUntilEnd}`);
    console.log(`   Within 60-day boundary: ${daysUntilEnd <= 60 ? 'YES' : 'NO'}`);
    console.log('');
    console.log('🎯 Now you should see:');
    console.log('   - Progress bar in My Tenants list');
    console.log('   - "Request Renewal" button (tenant dashboard)');
    console.log('   - "Propose Renewal" button (landlord)');
    console.log('   - "Ends in Xd" badge');

  } catch (error) {
    console.error('❌ Error fixing 60-day test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fix60DayTest();


