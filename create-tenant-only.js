import prisma from './lib/prisma.js';
import bcrypt from 'bcrypt';

const createTenantOnly = async () => {
  try {
    console.log('🔧 Creating tenant user only...');

    const tenantPassword = await bcrypt.hash('tenant123', 10);
    
    const tenant = await prisma.user.create({
      data: {
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
    
    console.log('✅ Tenant created successfully:', tenant.email);
    
  } catch (error) {
    console.error('❌ Error creating tenant:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

createTenantOnly(); 