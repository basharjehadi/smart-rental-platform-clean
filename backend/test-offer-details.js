import { prisma } from './src/utils/prisma.js';

async function testOfferDetails() {
  try {
    console.log('Testing offer details...');
    
    // Get all offers with full details
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
            email: true,
            phoneNumber: true,
            profileImage: true
          }
        }
      }
    });
    
    console.log('Total offers found:', offers.length);
    
    offers.forEach((offer, index) => {
      console.log(`\n=== Offer ${index + 1} ===`);
      console.log(`ID: ${offer.id}`);
      console.log(`Status: ${offer.status}`);
      console.log(`Rent Amount: ${offer.rentAmount} zł`);
      console.log(`Deposit: ${offer.depositAmount} zł`);
      console.log(`Duration: ${offer.leaseDuration} months`);
      console.log(`Available From: ${offer.availableFrom}`);
      
      console.log('\n--- Property Data from Offer ---');
      console.log(`Property Address: ${offer.propertyAddress}`);
      console.log(`Property Type: ${offer.propertyType}`);
      console.log(`Property Size: ${offer.propertySize}`);
      console.log(`Property Description: ${offer.propertyDescription}`);
      console.log(`Property Images: ${offer.propertyImages}`);
      console.log(`Property Amenities: ${offer.propertyAmenities}`);
      
      console.log('\n--- Rental Request Data ---');
      console.log(`Request Title: ${offer.rentalRequest?.title}`);
      console.log(`Request Location: ${offer.rentalRequest?.location}`);
      console.log(`Request Description: ${offer.rentalRequest?.description}`);
      console.log(`Request Bedrooms: ${offer.rentalRequest?.bedrooms}`);
      
      console.log('\n--- Landlord Info ---');
      console.log(`Landlord: ${offer.landlord?.name} (${offer.landlord?.email})`);
      console.log(`Landlord Phone: ${offer.landlord?.phoneNumber}`);
      
      console.log('\n--- Tenant Info ---');
      console.log(`Tenant: ${offer.rentalRequest?.tenant?.firstName} ${offer.rentalRequest?.tenant?.lastName} (${offer.rentalRequest?.tenant?.email})`);
      
      // Parse JSON fields
      if (offer.propertyImages) {
        try {
          const images = JSON.parse(offer.propertyImages);
          console.log(`Parsed Images:`, images);
        } catch (e) {
          console.log(`Image parsing error:`, e.message);
        }
      }
      
      if (offer.propertyAmenities) {
        try {
          const amenities = JSON.parse(offer.propertyAmenities);
          console.log(`Parsed Amenities:`, amenities);
        } catch (e) {
          console.log(`Amenities parsing error:`, e.message);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOfferDetails();
