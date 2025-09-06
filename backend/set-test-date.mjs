import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setTestDate() {
  try {
    console.log('🕒 Setting test date for lease lifecycle testing');
    console.log('===============================================');
    console.log('');
    
    // Get current offer
    const offer = await prisma.offer.findFirst({
      where: { status: 'PAID' }
    });

    if (!offer) {
      console.log('❌ No PAID offer found');
      return;
    }

    console.log('📋 Found offer:', offer.id);
    console.log('');

    // Set lease dates to create 60-day boundary scenario
    const leaseStartDate = new Date('2025-09-10');
    const leaseEndDate = new Date('2026-09-10');
    
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        leaseStartDate: leaseStartDate,
        leaseEndDate: leaseEndDate
      }
    });

    console.log('✅ Updated lease dates:');
    console.log(`   Start: ${leaseStartDate.toISOString().split('T')[0]}`);
    console.log(`   End: ${leaseEndDate.toISOString().split('T')[0]}`);
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
    console.log('');
    console.log('⚠️  To reset, run: node reset-lease-fresh.mjs');

  } catch (error) {
    console.error('❌ Error setting test date:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setTestDate();


