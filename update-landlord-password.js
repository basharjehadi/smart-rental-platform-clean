import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const updateLandlordPassword = async () => {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Update the landlord user's password
    const updatedLandlord = await prisma.user.update({
      where: {
        email: 'landlord@test.com'
      },
      data: {
        password: hashedPassword,
        isVerified: true
      }
    });

    console.log('✅ Landlord password updated successfully:', updatedLandlord.email);
    return updatedLandlord;

  } catch (error) {
    console.error('❌ Error updating landlord password:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await updateLandlordPassword();
  } catch (error) {
    console.error('❌ Failed to update landlord password:', error);
  } finally {
    await prisma.$disconnect();
  }
};

main(); 