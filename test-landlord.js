import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLandlord() {
  try {
    const landlord = await prisma.user.findUnique({
      where: { email: 'landlord@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        phoneNumber: true,
        address: true,
        dowodOsobistyNumber: true
      }
    });

    console.log('Landlord data:', landlord);

    if (!landlord) {
      console.log('Landlord not found!');
      return;
    }

    // Update landlord with complete profile if missing
    if (!landlord.firstName || !landlord.lastName || !landlord.phoneNumber || !landlord.address || !landlord.dowodOsobistyNumber) {
      console.log('Updating landlord profile...');
      
      await prisma.user.update({
        where: { email: 'landlord@example.com' },
        data: {
          firstName: 'Test',
          lastName: 'Landlord',
          phoneNumber: '+48123456789',
          address: 'Test Address, Warsaw, Poland',
          dowodOsobistyNumber: 'ABC123456',
          profileImage: null // No profile image for now
        }
      });
      
      console.log('Landlord profile updated!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLandlord(); 