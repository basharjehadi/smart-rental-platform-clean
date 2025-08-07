import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testFrontendAPICall() {
  try {
    console.log('🔍 Testing frontend API call simulation...');
    
    // Find a paid offer
    const offer = await prisma.offer.findFirst({
      where: {
        status: 'PAID'
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            pesel: true,
            passport: true,
            residenceCard: true,
            phone: true,
            signatureBase64: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            idCard: true,
            phone: true,
            signatureBase64: true
          }
        },
        property: {
          select: {
            id: true,
            address: true,
            propertyType: true,
            bedrooms: true,
            amenities: true
          }
        },
        rentalRequest: {
          select: {
            id: true,
            propertyAddress: true,
            propertyType: true,
            bedrooms: true,
            rentAmount: true,
            depositAmount: true,
            leaseDuration: true,
            availableFrom: true,
            utilitiesIncluded: true,
            description: true
          }
        }
      }
    });

    if (!offer) {
      console.log('❌ No paid offer found');
      return;
    }

    console.log('✅ Offer found');
    console.log('Offer ID:', offer.id);
    console.log('Offer status:', offer.status);
    
    // Simulate the transformation logic from rentalController.js
    const transformedOffer = {
      id: offer.id,
      status: offer.status,
      rentAmount: offer.rentAmount,
      depositAmount: offer.depositAmount,
      leaseDuration: offer.leaseDuration,
      availableFrom: offer.availableFrom,
      utilitiesIncluded: offer.utilitiesIncluded,
      description: offer.description,
      paymentDate: offer.paymentDate,
      paymentIntentId: offer.paymentIntentId,
      isPaid: offer.status === 'PAID' || (offer.status === 'ACCEPTED' && offer.paymentIntentId),
      
      // Property data
      propertyAddress: offer.rentalRequest?.propertyAddress || offer.property?.address || 'Property Address',
      propertyType: offer.rentalRequest?.propertyType || offer.property?.propertyType || 'Apartment',
      bedrooms: offer.rentalRequest?.bedrooms || offer.property?.bedrooms || 2,
      
      // Tenant data
      tenant: {
        id: offer.tenant?.id,
        name: offer.tenant?.name || 'Tenant',
        email: offer.tenant?.email || 'tenant@email.com',
        pesel: offer.tenant?.pesel || '97103010959',
        passport: offer.tenant?.passport || 'BH0603147',
        residenceCard: offer.tenant?.residenceCard || 'EG005784',
        phone: offer.tenant?.phone || '+48123456789',
        signatureBase64: offer.tenant?.signatureBase64
      },
      
      // Landlord data
      landlord: {
        id: offer.landlord?.id,
        name: offer.landlord?.name || 
              (offer.landlord?.firstName && offer.landlord?.lastName 
                ? `${offer.landlord.firstName} ${offer.landlord.lastName}` 
                : 'Landlord'),
        email: offer.landlord?.email || 'landlord@email.com',
        idCard: offer.landlord?.idCard || 'EG55568',
        phone: offer.landlord?.phone || '+48987654321',
        signatureBase64: offer.landlord?.signatureBase64
      }
    };

    console.log('\n🔍 Transformed Offer Data:');
    console.log('Tenant signature present:', !!transformedOffer.tenant.signatureBase64);
    console.log('Landlord signature present:', !!transformedOffer.landlord.signatureBase64);
    console.log('Tenant signature length:', transformedOffer.tenant.signatureBase64?.length || 0);
    console.log('Landlord signature length:', transformedOffer.landlord.signatureBase64?.length || 0);
    
    if (transformedOffer.tenant.signatureBase64) {
      console.log('Tenant signature starts with:', transformedOffer.tenant.signatureBase64.substring(0, 50) + '...');
    }
    
    if (transformedOffer.landlord.signatureBase64) {
      console.log('Landlord signature starts with:', transformedOffer.landlord.signatureBase64.substring(0, 50) + '...');
    }

    console.log('\n✅ Frontend API simulation complete');
    
  } catch (error) {
    console.error('❌ Error in frontend API simulation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendAPICall();
