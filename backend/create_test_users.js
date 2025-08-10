import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔧 Creating test users...\n');
    
    // Test users data
    const testUsers = [
      {
        name: 'John Tenant',
        email: 'tenant@test.com',
        password: 'password123',
        role: 'TENANT'
      },
      {
        name: 'Sarah Landlord',
        email: 'landlord@test.com',
        password: 'password123',
        role: 'LANDLORD'
      },
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'ADMIN'
      }
    ];
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role
        }
      });
      
      console.log(`✅ Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
    }
    
    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('='.repeat(50));
    console.log('1. Tenant Account:');
    console.log('   Email: tenant@test.com');
    console.log('   Password: password123');
    console.log('   Role: TENANT');
    console.log('');
    console.log('2. Landlord Account:');
    console.log('   Email: landlord@test.com');
    console.log('   Password: password123');
    console.log('   Role: LANDLORD');
    console.log('');
    console.log('3. Admin Account:');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   Role: ADMIN');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3002');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();


