import { prisma } from './src/utils/prisma.js';

async function testOffers() {
  try {
    console.log('Testing offers functionality...');
    
    // Get all offers
    const offers = await prisma.offer.findMany({
      include: {
        rentalRequest: {
          include: {
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('Total offers found:', offers.length);
    
    offers.forEach((offer, index) => {
      console.log(`\nOffer ${index + 1}:`);
      console.log(`- ID: ${offer.id}`);
      console.log(`- Status: ${offer.status}`);
      console.log(`- Rent Amount: ${offer.rentAmount} zł`);
      console.log(`- Created: ${offer.createdAt}`);
      console.log(`- Rental Request ID: ${offer.rentalRequestId}`);
      console.log(`- Landlord: ${offer.landlord?.name} (${offer.landlord?.email})`);
      console.log(`- Tenant: ${offer.rentalRequest?.tenant?.firstName} ${offer.rentalRequest?.tenant?.lastName} (${offer.rentalRequest?.tenant?.email})`);
    });
    
    // Get all rental requests
    const requests = await prisma.rentalRequest.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        offers: {
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n\nRental Requests with offers:');
    requests.forEach((request, index) => {
      console.log(`\nRequest ${index + 1}:`);
      console.log(`- ID: ${request.id}`);
      console.log(`- Title: ${request.title}`);
      console.log(`- Status: ${request.status}`);
      console.log(`- Pool Status: ${request.poolStatus}`);
      console.log(`- Tenant: ${request.tenant?.firstName} ${request.tenant?.lastName} (${request.tenant?.email})`);
      console.log(`- Offers count: ${request.offers.length}`);
      
      request.offers.forEach((offer, offerIndex) => {
        console.log(`  Offer ${offerIndex + 1}: ${offer.id} - ${offer.status} - ${offer.landlord?.name}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOffers();


