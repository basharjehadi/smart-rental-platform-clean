import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const createAdminUser = async () => {
  try {
    console.log('🔧 Creating admin user...');

    // Create admin password
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartrental.com' },
      update: {},
      create: {
        email: 'admin@smartrental.com',
        password: adminPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        phoneNumber: '+48123456789',
        address: 'Admin Address, 00-000 Warszawa',
        firstName: 'System',
        lastName: 'Administrator',
        isVerified: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('Email: admin@smartrental.com');
    console.log('Password: admin123');
    console.log('\n🔗 Frontend URL: http://localhost:5173');
    console.log('🔗 Backend URL: http://localhost:3001');
    console.log('\n🚀 You can now access the admin dashboard at: http://localhost:5173/admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdminUser(); 