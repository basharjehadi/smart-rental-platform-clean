import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLeaseData() {
  try {
    const leases = await prisma.lease.findMany({
      where: { status: 'ACTIVE' },
      include: { 
        offer: { 
          include: { 
            property: true,
            tenant: true 
          } 
        } 
      }
    });
    
    console.log('Active leases:');
    leases.forEach(lease => {
      const endDate = new Date(lease.endDate);
      const today = new Date();
      const daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      console.log(`- Lease ID: ${lease.id}`);
      console.log(`  Tenant: ${lease.offer?.tenant?.name || 'Unknown'}`);
      console.log(`  End Date: ${endDate.toISOString().split('T')[0]}`);
      console.log(`  Days until end: ${daysUntil}`);
      console.log(`  Should show badge: ${daysUntil <= 60}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaseData();


