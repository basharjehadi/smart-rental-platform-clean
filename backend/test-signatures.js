import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSignatures() {
  try {
    console.log('🔍 Testing signature data...');
    
    const offerId = 'cme0hgi6u0001exk0233lhcpo';
    const tenantId = 'cme02xa0n0000exg8cdequmk7';
    
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
        }
      }
    });
    
    if (!offer) {
      console.log('❌ Offer not found');
      return;
    }
    
    console.log('✅ Offer found');
    console.log('Tenant signature exists:', !!offer.rentalRequest.tenant.signatureBase64);
    console.log('Landlord signature exists:', !!offer.landlord.signatureBase64);
    
    if (offer.rentalRequest.tenant.signatureBase64) {
      console.log('Tenant signature length:', offer.rentalRequest.tenant.signatureBase64.length);
      console.log('Tenant signature starts with:', offer.rentalRequest.tenant.signatureBase64.substring(0, 50));
      console.log('Tenant signature has data URL prefix:', offer.rentalRequest.tenant.signatureBase64.startsWith('data:image/'));
    }
    
    if (offer.landlord.signatureBase64) {
      console.log('Landlord signature length:', offer.landlord.signatureBase64.length);
      console.log('Landlord signature starts with:', offer.landlord.signatureBase64.substring(0, 50));
      console.log('Landlord signature has data URL prefix:', offer.landlord.signatureBase64.startsWith('data:image/'));
    }
    
    // Test the transformation logic
    const tenantSignature = offer.rentalRequest.tenant?.signatureBase64 || null;
    const landlordSignature = offer.landlord?.signatureBase64 || null;
    
    console.log('\n🔍 Testing transformation logic:');
    console.log('Original tenant signature:', tenantSignature ? 'Present' : 'Missing');
    console.log('Original landlord signature:', landlordSignature ? 'Present' : 'Missing');
    
    // Clean up signature data - remove data URL prefix if present
    let cleanTenantSignature = tenantSignature;
    let cleanLandlordSignature = landlordSignature;
    
    if (cleanTenantSignature && cleanTenantSignature.startsWith('data:image/')) {
      cleanTenantSignature = cleanTenantSignature.split(',')[1];
      console.log('✅ Cleaned tenant signature (removed data URL prefix)');
    }
    
    if (cleanLandlordSignature && cleanLandlordSignature.startsWith('data:image/')) {
      cleanLandlordSignature = cleanLandlordSignature.split(',')[1];
      console.log('✅ Cleaned landlord signature (removed data URL prefix)');
    }
    
    console.log('Final tenant signature:', cleanTenantSignature ? 'Present' : 'Missing');
    console.log('Final landlord signature:', cleanLandlordSignature ? 'Present' : 'Missing');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSignatures();
