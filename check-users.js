import prisma from './lib/prisma.js';

const checkUsers = async () => {
  try {
    console.log('🔍 Checking users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - Verified: ${user.isVerified} - Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check specifically for tenant
    const tenant = await prisma.user.findUnique({
      where: { email: 'tenant@test.com' },
      select: { id: true, email: true, role: true, isVerified: true }
    });
    
    if (tenant) {
      console.log(`\n✅ Tenant found: ${tenant.email} (${tenant.role}) - Verified: ${tenant.isVerified}`);
    } else {
      console.log('\n❌ Tenant not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
};

checkUsers(); 