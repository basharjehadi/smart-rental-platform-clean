import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOfferSimple() {
  try {
    console.log('🔍 Testing offer details...');
    
    const offerId = 'cme0hgi6u0001exk0233lhcpo';
    const tenantId = 'cme02xa0n0000exg8cdequmk7';
    
    console.log('Looking for offer:', offerId);
    console.log('For tenant:', tenantId);
    
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        rentalRequest: {
          tenantId: tenantId
        }
      },
      include: {
        rentalRequest: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                signatureBase64: true
              }
            }
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            signatureBase64: true
          }
        },
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
            videos: true
          }
        }
      }
    });
    
    if (!offer) {
      console.log('❌ Offer not found');
      return;
    }
    
    console.log('✅ Offer found');
    console.log('Offer ID:', offer.id);
    console.log('Status:', offer.status);
    console.log('Landlord:', offer.landlord?.name);
    console.log('Tenant:', offer.rentalRequest?.tenant?.name);
    
    // Test the transformation
    const transformedOffer = {
      id: offer.id,
      status: offer.status,
      rentAmount: offer.rentAmount,
      depositAmount: offer.depositAmount,
      leaseDuration: offer.leaseDuration,
      description: offer.description,
      availableFrom: offer.availableFrom,
      isPaid: offer.status === 'PAID' || (offer.status === 'ACCEPTED' && offer.paymentIntentId),
      paymentIntentId: offer.paymentIntentId,
      paymentDate: offer.paymentDate,
      leaseStartDate: offer.leaseStartDate,
      leaseEndDate: offer.leaseEndDate,
      propertyAddress: offer.propertyAddress,
      propertyImages: offer.propertyImages,
      propertyVideo: offer.propertyVideo,
      propertyType: offer.propertyType,
      propertySize: offer.propertySize,
      propertyAmenities: offer.propertyAmenities,
      propertyDescription: offer.propertyDescription,
      rulesText: offer.rulesText,
      rulesPdf: offer.rulesPdf,
      preferredPaymentGateway: offer.preferredPaymentGateway,
      responseTime: offer.responseTime,
      matchScore: offer.matchScore,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      rentalRequestId: offer.rentalRequestId,
      landlordId: offer.landlordId,
      propertyId: offer.propertyId,
      
      // Include rental request data
      rentalRequest: offer.rentalRequest,
      
      // Include landlord data
      landlord: {
        ...offer.landlord,
        name: offer.landlord?.firstName && offer.landlord?.lastName ? 
          `${offer.landlord.firstName} ${offer.landlord.lastName}` : 
          offer.landlord?.name || 'Landlord'
      },
      
      // Include property data if available
      property: offer.property,
      
      // Include tenant data
      tenant: {
        id: offer.rentalRequest.tenantId,
        name: offer.rentalRequest.tenant?.name || 'Tenant',
        email: offer.rentalRequest.tenant?.email || 'tenant@email.com',
        signatureBase64: offer.rentalRequest.tenant?.signatureBase64 || null
      }
    };
    
    console.log('✅ Transformation successful');
    console.log('Transformed offer ID:', transformedOffer.id);
    console.log('Is paid:', transformedOffer.isPaid);
    console.log('Landlord name:', transformedOffer.landlord.name);
    console.log('Tenant name:', transformedOffer.tenant.name);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testOfferSimple();
