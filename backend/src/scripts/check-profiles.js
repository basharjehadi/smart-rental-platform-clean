import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfiles() {
  try {
    console.log('🔍 Checking tenant and landlord profiles...');

    // Get the paid offer with tenant and landlord data
    const offer = await prisma.offer.findFirst({
      where: {
        status: 'PAID',
      },
      include: {
        rentalRequest: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                street: true,
                city: true,
                zipCode: true,
                country: true,
                profession: true,
                citizenship: true,
                dateOfBirth: true,
                profileImage: true,
                signatureBase64: true,
                isVerified: true,
                kycStatus: true,
              },
            },
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            street: true,
            city: true,
            zipCode: true,
            country: true,
            profession: true,
            citizenship: true,
            dateOfBirth: true,
            profileImage: true,
            signatureBase64: true,
            isVerified: true,
            kycStatus: true,
            dowodOsobistyNumber: true,
            address: true,
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

    console.log('\n👤 Tenant Profile:');
    const tenant = offer.rentalRequest.tenant;
    console.log('ID:', tenant.id);
    console.log('Name:', tenant.name);
    console.log('Email:', tenant.email);
    console.log('FirstName:', tenant.firstName);
    console.log('LastName:', tenant.lastName);
    console.log('Phone:', tenant.phoneNumber);
    console.log(
      'Address:',
      tenant.street && tenant.city
        ? `${tenant.street}, ${tenant.city} ${tenant.zipCode}, ${tenant.country}`
        : 'Not provided'
    );
    console.log('Profession:', tenant.profession);
    console.log('Citizenship:', tenant.citizenship);
    console.log('Date of Birth:', tenant.dateOfBirth);
    console.log('Profile Image:', tenant.profileImage ? 'Yes' : 'No');
    console.log('Signature:', tenant.signatureBase64 ? 'Yes' : 'No');
    console.log('Verified:', tenant.isVerified);
    console.log('KYC Status:', tenant.kycStatus);

    console.log('\n👤 Landlord Profile:');
    const landlord = offer.landlord;
    console.log('ID:', landlord.id);
    console.log('Name:', landlord.name);
    console.log('Email:', landlord.email);
    console.log('FirstName:', landlord.firstName);
    console.log('LastName:', landlord.lastName);
    console.log('Phone:', landlord.phoneNumber);
    console.log(
      'Address:',
      landlord.street && landlord.city
        ? `${landlord.street}, ${landlord.city} ${landlord.zipCode}, ${landlord.country}`
        : 'Not provided'
    );
    console.log('Profession:', landlord.profession);
    console.log('Citizenship:', landlord.citizenship);
    console.log('Date of Birth:', landlord.dateOfBirth);
    console.log('Profile Image:', landlord.profileImage ? 'Yes' : 'No');
    console.log('Signature:', landlord.signatureBase64 ? 'Yes' : 'No');
    console.log('Verified:', landlord.isVerified);
    console.log('KYC Status:', landlord.kycStatus);
    console.log('Dowod Osobisty:', landlord.dowodOsobistyNumber);
    console.log('Landlord Address:', landlord.address);

    // Check signature lengths
    if (tenant.signatureBase64) {
      console.log(
        '\n📏 Tenant Signature Length:',
        tenant.signatureBase64.length
      );
    }
    if (landlord.signatureBase64) {
      console.log(
        '📏 Landlord Signature Length:',
        landlord.signatureBase64.length
      );
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles();
