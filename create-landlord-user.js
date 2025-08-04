import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const createLandlordUser = async () => {
  try {
    // Check if landlord already exists
    const existingLandlord = await prisma.user.findUnique({
      where: {
        email: 'landlord@test.com'
      }
    });

    if (existingLandlord) {
      console.log('✅ Landlord user already exists');
      return existingLandlord;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create landlord user
    const landlord = await prisma.user.create({
      data: {
        name: 'Test Landlord',
        email: 'landlord@test.com',
        password: hashedPassword,
        role: 'LANDLORD',
        isVerified: true
      }
    });

    console.log('✅ Landlord user created successfully:', landlord.email);
    return landlord;

  } catch (error) {
    console.error('❌ Error creating landlord user:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await createLandlordUser();
  } catch (error) {
    console.error('❌ Failed to create landlord user:', error);
  } finally {
    await prisma.$disconnect();
  }
};

main(); 