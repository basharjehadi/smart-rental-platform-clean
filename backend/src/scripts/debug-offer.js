import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugOffer() {
  try {
    console.log('🔍 Debugging offer data...');

    // Find the specific offer from your logs
    const offerId = 'cmeymqn78000aex1wrc0h8qy8';
    
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        rentalRequest: {
          select: {
            id: true,
            moveInDate: true,
            title: true,
          },
        },
        organization: {
          include: {
            members: {
              where: { role: 'OWNER' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!offer) {
      console.log('❌ Offer not found');
      return;
    }

    console.log('📊 Offer Details:');
    console.log('================');
    console.log(`ID: ${offer.id}`);
    console.log(`Status: ${offer.status}`);
    console.log(`Rent Amount: ${offer.rentAmount}`);
    console.log(`Deposit Amount: ${offer.depositAmount}`);
    console.log(`Lease Duration: ${offer.leaseDuration}`);
    console.log(`Available From: ${offer.availableFrom}`);
    console.log(`Available From Type: ${typeof offer.availableFrom}`);
    console.log(`Available From Valid: ${offer.availableFrom instanceof Date && !isNaN(offer.availableFrom.getTime())}`);
    
    if (offer.availableFrom) {
      console.log(`Available From ISO: ${offer.availableFrom.toISOString()}`);
      console.log(`Available From String: ${offer.availableFrom.toString()}`);
    }

    console.log('\n📊 Rental Request Details:');
    console.log('========================');
    console.log(`ID: ${offer.rentalRequest.id}`);
    console.log(`Title: ${offer.rentalRequest.title}`);
    console.log(`Move In Date: ${offer.rentalRequest.moveInDate}`);
    console.log(`Move In Date Type: ${typeof offer.rentalRequest.moveInDate}`);
    console.log(`Move In Date Valid: ${offer.rentalRequest.moveInDate instanceof Date && !isNaN(offer.rentalRequest.moveInDate.getTime())}`);

    if (offer.rentalRequest.moveInDate) {
      console.log(`Move In Date ISO: ${offer.rentalRequest.moveInDate.toISOString()}`);
      console.log(`Move In Date String: ${offer.rentalRequest.moveInDate.toString()}`);
    }

    console.log('\n📊 Organization Details:');
    console.log('========================');
    console.log(`Organization ID: ${offer.organization.id}`);
    console.log(`Members Count: ${offer.organization.members.length}`);
    
    if (offer.organization.members.length > 0) {
      const owner = offer.organization.members[0];
      console.log(`Owner User ID: ${owner.user.id}`);
      console.log(`Owner Name: ${owner.user.name}`);
      console.log(`Owner Email: ${owner.user.email}`);
    }

    // Test the date calculation logic
    console.log('\n🧮 Testing Date Calculation:');
    console.log('============================');
    
    let leaseStartDate;
    if (offer.rentalRequest.moveInDate) {
      leaseStartDate = new Date(offer.rentalRequest.moveInDate);
      console.log(`✅ Using rental request move-in date: ${leaseStartDate}`);
    } else if (offer.availableFrom) {
      leaseStartDate = new Date(offer.availableFrom);
      console.log(`✅ Using offer available from date: ${leaseStartDate}`);
    } else {
      leaseStartDate = new Date();
      console.log(`⚠️ Using current date as fallback: ${leaseStartDate}`);
    }

    if (leaseStartDate && !isNaN(leaseStartDate.getTime())) {
      const leaseEndDate = new Date(leaseStartDate);
      leaseEndDate.setMonth(leaseEndDate.getMonth() + offer.leaseDuration);
      console.log(`✅ Lease start date: ${leaseStartDate.toISOString()}`);
      console.log(`✅ Lease end date: ${leaseEndDate.toISOString()}`);
      console.log(`✅ Lease duration: ${offer.leaseDuration} months`);
    } else {
      console.log(`❌ Invalid lease start date: ${leaseStartDate}`);
    }

  } catch (error) {
    console.error('❌ Error debugging offer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugOffer();
