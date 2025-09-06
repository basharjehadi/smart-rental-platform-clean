import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTenantData() {
  try {
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
    
    console.log('PAID offers with lease data:');
    for (const offer of offers) {
      console.log(`Offer ID: ${offer.id}`);
      console.log(`Tenant: ${offer.rentalRequest?.tenantGroup?.members?.[0]?.name || 'Unknown'}`);
      console.log(`Lease Start Date: ${offer.leaseStartDate}`);
      console.log(`Lease Duration: ${offer.leaseDuration} months`);
      console.log(`Move In Date: ${offer.rentalRequest?.moveInDate}`);
      
      // Calculate lease end date
      if (offer.leaseStartDate && offer.leaseDuration) {
        const startDate = new Date(offer.leaseStartDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + offer.leaseDuration);
        console.log(`Calculated End Date: ${endDate.toISOString().split('T')[0]}`);
      }
      console.log('---');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantData();