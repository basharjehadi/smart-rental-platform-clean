import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugOffer() {
  try {
    console.log('🔍 Debugging offer data...');
    
    // Get the specific offer that should be returned
    const offer = await prisma.offer.findFirst({
      where: {
        status: 'PAID'
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        landlord: {
          include: {
            properties: true
          }
        }
      }
    });
    
    if (!offer) {
      console.log('❌ No paid offer found');
      return;
    }
    
    console.log('📋 Offer details:');
    console.log('ID:', offer.id);
    console.log('ID type:', typeof offer.id);
    console.log('ID length:', offer.id.length);
    console.log('Status:', offer.status);
    console.log('Tenant ID:', offer.rentalRequest.tenantId);
    console.log('Landlord ID:', offer.landlordId);
    
    // Simulate the dashboard response
    const responseData = {
      tenant: { id: offer.rentalRequest.tenantId, name: 'Test Tenant' },
      hasActiveLease: true,
      offerId: offer.id,
      property: {
        address: offer.rentalRequest.location,
        rooms: offer.rentalRequest.bedrooms || 2,
        bathrooms: offer.rentalRequest.bathrooms || 1,
        area: offer.propertySize || '65 m²',
        leaseTerm: offer.leaseDuration || 12,
        amenities: offer.propertyAmenities ? JSON.parse(offer.propertyAmenities) : ['Parking Space', 'Washing Machine', 'Air Conditioning', 'Balcony', 'Internet', 'Elevator']
      },
      landlord: {
        name: offer.landlord.firstName + ' ' + offer.landlord.lastName,
        company: offer.landlord.company || 'Individual Landlord',
        email: offer.landlord.email,
        phone: offer.landlord.phoneNumber || 'Not provided',
        address: offer.landlord.street && offer.landlord.city ? 
          `${offer.landlord.street}, ${offer.landlord.city} ${offer.landlord.zipCode}, ${offer.landlord.country}` : 
          'Not provided'
      },
      lease: {
        startDate: offer.rentalRequest.moveInDate,
        endDate: offer.leaseEndDate || new Date(offer.rentalRequest.moveInDate).setFullYear(
          new Date(offer.rentalRequest.moveInDate).getFullYear() + 1
        ),
        monthlyRent: offer.rentAmount || offer.rentalRequest.budget || 0,
        securityDeposit: offer.depositAmount || offer.rentalRequest.budget || 0
      }
    };
    
    console.log('\n📤 Response data:');
    console.log('offerId in response:', responseData.offerId);
    console.log('offerId type:', typeof responseData.offerId);
    console.log('offerId length:', responseData.offerId.length);
    
    // Test the API call
    console.log('\n🔗 Test API URL:');
    console.log(`/tenant/offer/${responseData.offerId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOffer();
