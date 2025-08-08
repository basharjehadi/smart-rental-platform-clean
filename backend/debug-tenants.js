import { prisma } from './src/utils/prisma.js';

async function debugTenants() {
  try {
    console.log('🔍 Checking database for tenants...');
    
    // Check all offers
    const allOffers = await prisma.offer.findMany({
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        property: true
      }
    });
    
    console.log('📊 All offers:', allOffers.length);
    allOffers.forEach(offer => {
      console.log(`Offer ID: ${offer.id}, Status: ${offer.status}, Landlord: ${offer.landlordId}, Tenant: ${offer.rentalRequest?.tenant?.name}`);
    });
    
    // Check paid offers specifically
    const paidOffers = await prisma.offer.findMany({
      where: {
        status: 'PAID'
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        property: true
      }
    });
    
    console.log('💰 Paid offers:', paidOffers.length);
    paidOffers.forEach(offer => {
      console.log(`Paid Offer ID: ${offer.id}, Landlord: ${offer.landlordId}, Tenant: ${offer.rentalRequest?.tenant?.name}`);
    });
    
    // Check users
    const users = await prisma.user.findMany({
      where: {
        role: 'LANDLORD'
      }
    });
    
    console.log('👥 Landlords:', users.length);
    users.forEach(user => {
      console.log(`Landlord ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTenants();
