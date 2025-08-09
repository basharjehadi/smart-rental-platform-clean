import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in the database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        createdAt: true,
        isVerified: true,
        kycStatus: true
      }
    });
    
    console.log(`📊 Total users found: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in the database.');
      console.log('💡 You can create users through:');
      console.log('   1. Registration API: POST /api/auth/register');
      console.log('   2. Prisma Studio: npx prisma studio');
      console.log('   3. Direct database insertion');
    } else {
      console.log('👥 Users in the database:');
      console.log('='.repeat(80));
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. User Details:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password: ${user.password ? '✅ Hashed' : '❌ No password (Google OAuth)'}`);
        console.log(`   Verified: ${user.isVerified ? '✅ Yes' : '❌ No'}`);
        console.log(`   KYC Status: ${user.kycStatus}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log('');
      });
      
      // Show login credentials for users with passwords
      const usersWithPasswords = users.filter(user => user.password);
      if (usersWithPasswords.length > 0) {
        console.log('🔑 Login Credentials (for users with passwords):');
        console.log('='.repeat(80));
        usersWithPasswords.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}`);
          console.log(`   Password: [Hashed - cannot be retrieved]`);
          console.log(`   Note: Passwords are hashed for security. You'll need to reset them.`);
          console.log('');
        });
      }
      
      // Show Google OAuth users
      const googleUsers = users.filter(user => !user.password);
      if (googleUsers.length > 0) {
        console.log('🔐 Google OAuth Users (no password required):');
        console.log('='.repeat(80));
        googleUsers.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}`);
          console.log(`   Login: Use Google OAuth button`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();


