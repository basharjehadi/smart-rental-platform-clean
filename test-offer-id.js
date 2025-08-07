import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOfferId() {
  try {
    console.log('🔍 Testing offer ID format...');
    
    // Get all offers
    const offers = await prisma.offer.findMany({
      take: 5,
      select: {
        id: true,
        status: true,
        rentalRequest: {
          select: {
            tenantId: true
          }
        }
      }
    });
    
    console.log('📋 Found offers:');
    offers.forEach((offer, index) => {
      console.log(`${index + 1}. ID: "${offer.id}" | Status: ${offer.status} | Tenant: ${offer.rentalRequest.tenantId}`);
    });
    
    // Get paid offers specifically
    const paidOffers = await prisma.offer.findMany({
      where: {
        status: 'PAID'
      },
      select: {
        id: true,
        status: true,
        rentalRequest: {
          select: {
            tenantId: true
          }
        }
      }
    });
    
    console.log('\n💰 Paid offers:');
    paidOffers.forEach((offer, index) => {
      console.log(`${index + 1}. ID: "${offer.id}" | Status: ${offer.status} | Tenant: ${offer.rentalRequest.tenantId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOfferId();
