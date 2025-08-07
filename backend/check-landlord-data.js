import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLandlordData() {
  try {
    console.log('🔍 Checking landlord data...');
    
    // Get the offer with landlord data
    const offer = await prisma.offer.findFirst({
      where: {
        status: 'PAID'
      },
      include: {
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
        }
      }
    });
    
    if (!offer) {
      console.log('❌ No paid offer found');
      return;
    }
    
    console.log('📋 Offer details:');
    console.log('ID:', offer.id);
    console.log('Status:', offer.status);
    
    console.log('\n👤 Landlord details:');
    console.log('ID:', offer.landlord.id);
    console.log('Name:', offer.landlord.name);
    console.log('FirstName:', offer.landlord.firstName);
    console.log('LastName:', offer.landlord.lastName);
    console.log('Email:', offer.landlord.email);
    console.log('Phone:', offer.landlord.phoneNumber);
    console.log('Has signature:', offer.landlord.signatureBase64 ? 'Yes' : 'No');
    
    console.log('\n👤 Tenant details:');
    console.log('ID:', offer.rentalRequest.tenant.id);
    console.log('Name:', offer.rentalRequest.tenant.name);
    console.log('Email:', offer.rentalRequest.tenant.email);
    console.log('Has signature:', offer.rentalRequest.tenant.signatureBase64 ? 'Yes' : 'No');
    
    // Test the transformation logic
    console.log('\n🔧 Testing transformation logic:');
    const landlordName = offer.landlord?.firstName && offer.landlord?.lastName ? 
      `${offer.landlord.firstName} ${offer.landlord.lastName}` : 
      offer.landlord?.name || 'Landlord';
    
    console.log('Computed landlord name:', landlordName);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLandlordData();
