import { prisma } from './src/utils/prisma.js';

async function testTenantOffers() {
  try {
    console.log('Testing tenant offers API...');
    
    // Get the tenant user
    const tenant = await prisma.user.findFirst({
      where: { role: 'TENANT' }
    });
    
    if (!tenant) {
      console.log('No tenant found');
      return;
    }
    
    console.log('Tenant:', tenant.id, tenant.email);
    
    // Simulate the getMyOffers query
    const offers = await prisma.offer.findMany({
      where: {
        rentalRequest: {
          tenantId: tenant.id
        }
      },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true,
            location: true,
            description: true,
            budgetFrom: true,
            budgetTo: true,
            bedrooms: true,
            moveInDate: true,
            status: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Offers found for tenant:', offers.length);
    
    offers.forEach((offer, index) => {
      console.log(`\nOffer ${index + 1}:`);
      console.log(`- ID: ${offer.id}`);
      console.log(`- Status: ${offer.status}`);
      console.log(`- Rent Amount: ${offer.rentAmount} zł`);
      console.log(`- Created: ${offer.createdAt}`);
      console.log(`- Rental Request: ${offer.rentalRequest?.title}`);
      console.log(`- Landlord: ${offer.landlord?.name} (${offer.landlord?.email})`);
    });
    
    // Transform offers like the backend does
    const transformedOffers = offers.map(offer => ({
      ...offer,
      propertyTitle: offer.rentalRequest?.title || 'Property Offer',
      propertyAddress: offer.propertyAddress || offer.rentalRequest?.location || 'Location not specified',
      propertyImages: offer.propertyImages || null,
      propertyAmenities: offer.propertyAmenities || null,
      propertyType: offer.propertyType || 'Apartment',
      propertySize: offer.propertySize || offer.rentalRequest?.bedrooms?.toString() || '1',
      isPaid: offer.status === 'ACCEPTED' && offer.paymentIntentId ? true : false
    }));
    
    console.log('\nTransformed offers:', transformedOffers.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTenantOffers();


