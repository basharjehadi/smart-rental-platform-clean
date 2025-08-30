import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPropertyAmenities() {
  try {
    console.log('🔍 Checking property amenities data...');

    // Get the offer with property data
    const offer = await prisma.offer.findFirst({
      where: {
        status: 'PAID',
      },
      select: {
        id: true,
        status: true,
        propertyAmenities: true,
        property: {
          select: {
            id: true,
            name: true,
            furnished: true,
            parking: true,
            petsAllowed: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
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
    console.log('Property Amenities (raw):', offer.propertyAmenities);
    console.log('Property Amenities type:', typeof offer.propertyAmenities);

    if (offer.property) {
      console.log('\n🏠 Property details:');
      console.log('ID:', offer.property.id);
      console.log('Name:', offer.property.name);
      console.log('Furnished:', offer.property.furnished);
      console.log('Parking:', offer.property.parking);
      console.log('Pets Allowed:', offer.property.petsAllowed);
      console.log('Bedrooms:', offer.property.bedrooms);
      console.log('Bathrooms:', offer.property.bathrooms);
      console.log('Size:', offer.property.size);

      // Test the amenities generation
      console.log('\n🔧 Testing amenities generation:');
      const generatedAmenities = [
        offer.property.furnished ? 'Furnished' : 'Unfurnished',
        offer.property.parking ? 'Parking' : 'No Parking',
        offer.property.petsAllowed ? 'Pets Allowed' : 'No Pets',
        offer.property.bedrooms ? `${offer.property.bedrooms} Bedrooms` : '',
        offer.property.bathrooms ? `${offer.property.bathrooms} Bathrooms` : '',
        offer.property.size ? `${offer.property.size} m²` : '',
      ].filter(Boolean);

      console.log('Generated amenities:', generatedAmenities);
      console.log('JSON stringified:', JSON.stringify(generatedAmenities));

      // Test the final propertyAmenities assignment
      const finalAmenities =
        offer.propertyAmenities || JSON.stringify(generatedAmenities);
      console.log('Final propertyAmenities:', finalAmenities);

      // Test parsing
      try {
        const parsed = JSON.parse(finalAmenities);
        console.log('Parsed successfully:', parsed);
      } catch (parseError) {
        console.log('Parse error:', parseError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPropertyAmenities();
