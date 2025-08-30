import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOfferProperty() {
  try {
    console.log('🔍 Checking offer property data...');

    // Get the offer with property data
    const offer = await prisma.offer.findFirst({
      where: {
        status: 'PAID',
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            district: true,
            zipCode: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            furnished: true,
            parking: true,
            petsAllowed: true,
            description: true,
            images: true,
            videos: true,
          },
        },
      },
    });

    if (!offer) {
      console.log('❌ No paid offer found');
      return;
    }

    console.log('📋 Offer details:');
    console.log('ID:', offer.id);
    console.log('Status:', offer.status);
    console.log('Property ID:', offer.propertyId);
    console.log('Has linked property:', offer.property ? 'Yes' : 'No');

    if (offer.property) {
      console.log('\n🏠 Property details:');
      console.log('ID:', offer.property.id);
      console.log('Name:', offer.property.name);
      console.log('Address:', offer.property.address);
      console.log('City:', offer.property.city);
      console.log('Property Type:', offer.property.propertyType);
      console.log('Bedrooms:', offer.property.bedrooms);
      console.log('Bathrooms:', offer.property.bathrooms);
      console.log('Size:', offer.property.size);
    } else {
      console.log('\n❌ No linked property found');
      console.log('Property fields on offer:');
      console.log('- propertyAddress:', offer.propertyAddress);
      console.log('- propertyImages:', offer.propertyImages);
      console.log('- propertyVideo:', offer.propertyVideo);
      console.log('- propertyType:', offer.propertyType);
      console.log('- propertySize:', offer.propertySize);
      console.log('- propertyAmenities:', offer.propertyAmenities);
      console.log('- propertyDescription:', offer.propertyDescription);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOfferProperty();
