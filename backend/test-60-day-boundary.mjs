import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function set60DayBoundary() {
  try {
    console.log('🔄 Setting up 60-day boundary test scenario');
    console.log('==========================================');
    console.log('Simulating today as July 15, 2026');
    console.log('Current lease: Sep 10, 2025 - Sep 10, 2026');
    console.log('Days until end: ~57 days (within 60-day boundary)');
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
    console.log(`   Current lease start: ${offer.leaseStartDate}`);
    console.log(`   Current lease duration: ${offer.leaseDuration} months`);

    // Set lease start date to Sep 10, 2025 (so end date will be Sep 10, 2026)
    const leaseStartDate = new Date('2025-09-10');
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + (offer.leaseDuration || 12));

    // Update the offer with the new lease dates
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        leaseStartDate: leaseStartDate,
        leaseEndDate: leaseEndDate
      }
    });

    console.log('✅ Updated offer with lease dates:');
    console.log(`   Lease start: ${leaseStartDate.toISOString().split('T')[0]}`);
    console.log(`   Lease end: ${leaseEndDate.toISOString().split('T')[0]}`);
    console.log('');

    // Calculate days until end (simulating July 15, 2026)
    const simulatedToday = new Date('2026-07-15');
    const daysUntilEnd = Math.ceil((leaseEndDate - simulatedToday) / (1000 * 60 * 60 * 24));
    
    console.log('📊 Test scenario ready:');
    console.log(`   Simulated today: ${simulatedToday.toISOString().split('T')[0]}`);
    console.log(`   Days until lease end: ${daysUntilEnd}`);
    console.log(`   Within 60-day boundary: ${daysUntilEnd <= 60 ? 'YES' : 'NO'}`);
    console.log('');
    console.log('🎯 Now you can test:');
    console.log('   - Progress bar should be visible');
    console.log('   - "Request Renewal" button should appear (tenant)');
    console.log('   - "Propose Renewal" button should appear (landlord)');
    console.log('   - "Ends in Xd" badge should show');

  } catch (error) {
    console.error('❌ Error setting up 60-day boundary test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

set60DayBoundary();


