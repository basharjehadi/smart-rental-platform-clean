import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test users
  const users = [
    {
      name: 'John Tenant',
      email: 'tenant@test.com',
      password: hashedPassword,
      role: 'TENANT',
      firstName: 'John',
      lastName: 'Tenant',
      phoneNumber: '+48573997766',
      citizenship: 'Polish',
      pesel: '90010112345',
      street: 'Warszawska 123',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'Poland',
      profession: 'Software Developer'
    },
    {
      name: 'Anna Landlord',
      email: 'landlord@test.com',
      password: hashedPassword,
      role: 'LANDLORD',
      firstName: 'Anna',
      lastName: 'Landlord',
      phoneNumber: '+48573997767',
      citizenship: 'Polish',
      pesel: '85020267890',
      street: 'Krakowska 456',
      city: 'Kraków',
      zipCode: '30-001',
      country: 'Poland',
      profession: 'Property Manager'
    },
    {
      name: 'Maria Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Maria',
      lastName: 'Admin',
      phoneNumber: '+48573997768',
      citizenship: 'Polish',
      pesel: '80030311111',
      street: 'Gdańska 789',
      city: 'Gdańsk',
      zipCode: '80-001',
      country: 'Poland',
      profession: 'System Administrator'
    },
    {
      name: 'David Foreigner',
      email: 'foreigner@test.com',
      password: hashedPassword,
      role: 'TENANT',
      firstName: 'David',
      lastName: 'Foreigner',
      phoneNumber: '+48573997769',
      citizenship: 'Non-Polish',
      passportNumber: 'US123456789',
      dateOfBirth: new Date('1990-05-15'),
      street: 'Mickiewicza 321',
      city: 'Poznań',
      zipCode: '60-001',
      country: 'Poland',
      profession: 'English Teacher'
    }
  ];

  for (const userData of users) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          emailVerified: true,
          phoneVerified: true
        }
      });

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test User Credentials:');
  console.log('========================');
  console.log('👤 Tenant:');
  console.log('   Email: tenant@test.com');
  console.log('   Password: password123');
  console.log('   Role: TENANT');
  console.log('');
  console.log('🏠 Landlord:');
  console.log('   Email: landlord@test.com');
  console.log('   Password: password123');
  console.log('   Role: LANDLORD');
  console.log('');
  console.log('👨‍💼 Admin:');
  console.log('   Email: admin@test.com');
  console.log('   Password: password123');
  console.log('   Role: ADMIN');
  console.log('');
  console.log('🌍 Foreign Tenant:');
  console.log('   Email: foreigner@test.com');
  console.log('   Password: password123');
  console.log('   Role: TENANT (Non-Polish)');
  console.log('');
  console.log('🔗 Frontend URL: http://localhost:3002/');
  console.log('🔗 Backend URL: http://localhost:3001/');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 