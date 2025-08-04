import prisma from './lib/prisma.js';
import bcrypt from 'bcrypt';

const createTestUsers = async () => {
  try {
    console.log('🔧 Creating test users...');

    // Create a test tenant
    try {
      const tenantPassword = await bcrypt.hash('tenant123', 10);
      const tenant = await prisma.user.upsert({
        where: { email: 'tenant@test.com' },
        update: {
          password: tenantPassword,
          name: 'John Tenant',
          role: 'TENANT',
          phoneNumber: '+48123456789',
          pesel: '12345678901',
          passportNumber: 'AB123456',
          kartaPobytuNumber: '123456789',
          address: 'ul. Testowa 1, 00-001 Warszawa',
          firstName: 'John',
          lastName: 'Tenant',
          isVerified: true
        },
        create: {
          email: 'tenant@test.com',
          password: tenantPassword,
          name: 'John Tenant',
          role: 'TENANT',
          phoneNumber: '+48123456789',
          pesel: '12345678901',
          passportNumber: 'AB123456',
          kartaPobytuNumber: '123456789',
          address: 'ul. Testowa 1, 00-001 Warszawa',
          firstName: 'John',
          lastName: 'Tenant',
          isVerified: true
        }
      });
      
      console.log('✅ Tenant created/updated:', tenant.email);
    } catch (error) {
      console.error('❌ Error creating tenant:', error);
    }

    // Create a test landlord
    const landlordPassword = await bcrypt.hash('landlord123', 10);
    const landlord = await prisma.user.upsert({
      where: { email: 'landlord@test.com' },
      update: {
        password: landlordPassword,
        name: 'Anna Landlord',
        role: 'LANDLORD',
        phoneNumber: '+48987654321',
        dowodOsobistyNumber: 'ABC123456',
        address: 'ul. Właściciela 5, 00-002 Warszawa',
        firstName: 'Anna',
        lastName: 'Landlord',
        isVerified: true
      },
      create: {
        email: 'landlord@test.com',
        password: landlordPassword,
        name: 'Anna Landlord',
        role: 'LANDLORD',
        phoneNumber: '+48987654321',
        dowodOsobistyNumber: 'ABC123456',
        address: 'ul. Właściciela 5, 00-002 Warszawa',
        firstName: 'Anna',
        lastName: 'Landlord',
        isVerified: true
      }
    });
    
    console.log('✅ Landlord created/updated:', landlord.email);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartrental.com' },
      update: {
        password: adminPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        phoneNumber: '+48123456789',
        address: 'Admin Address, 00-000 Warszawa',
        firstName: 'System',
        lastName: 'Administrator',
        isVerified: true
      },
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
    
    console.log('✅ Admin created/updated:', admin.email);

    console.log('✅ Test users created successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('\n👤 TENANT:');
    console.log('Email: tenant@test.com');
    console.log('Password: tenant123');
    console.log('\n🏠 LANDLORD:');
    console.log('Email: landlord@test.com');
    console.log('Password: landlord123');
    console.log('\n🔧 ADMIN:');
    console.log('Email: admin@smartrental.com');
    console.log('Password: admin123');
    console.log('\n🔗 Frontend URL: http://localhost:5173');
    console.log('🔗 Backend URL: http://localhost:3001');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
};

createTestUsers(); 