import { prisma } from './backend/src/utils/prisma.js';

const testTenantRole = async () => {
  try {
    console.log('🧪 Testing Tenant User Role...\n');

    // Find the tenant user
    const tenant = await prisma.user.findFirst({
      where: {
        email: 'tenant@test.com'
      }
    });

    if (!tenant) {
      console.log('❌ Tenant user not found');
      return;
    }

    console.log('✅ Tenant user found');
    console.log('📋 User ID:', tenant.id);
    console.log('📋 Email:', tenant.email);
    console.log('📋 Name:', tenant.name);
    console.log('📋 Role:', tenant.role);
    console.log('📋 Created:', tenant.createdAt);

    // Check if role is correct
    if (tenant.role === 'TENANT') {
      console.log('✅ Role is correct: TENANT');
    } else {
      console.log('❌ Role is incorrect. Expected: TENANT, Got:', tenant.role);
      
      // Update the role if it's wrong
      console.log('\n🔄 Updating role to TENANT...');
      await prisma.user.update({
        where: { id: tenant.id },
        data: { role: 'TENANT' }
      });
      console.log('✅ Role updated successfully');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testTenantRole(); 