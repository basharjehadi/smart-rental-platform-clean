import bcrypt from 'bcrypt';
import { prisma } from './backend/src/utils/prisma.js';

const testPassword = async () => {
  try {
    console.log('🧪 Testing Tenant Password...\n');

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
    console.log('📋 Has password:', !!tenant.password);

    if (!tenant.password) {
      console.log('❌ User has no password');
      return;
    }

    // Test the password
    const testPassword = 'tenant123';
    const isPasswordValid = await bcrypt.compare(testPassword, tenant.password);

    console.log('📋 Testing password:', testPassword);
    console.log('📋 Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect');
      
      // Let's try to create a new password hash
      console.log('\n🔄 Creating new password hash...');
      const newPasswordHash = await bcrypt.hash(testPassword, 10);
      console.log('📋 New password hash created');
      
      // Update the user's password
      await prisma.user.update({
        where: { id: tenant.id },
        data: { password: newPasswordHash }
      });
      
      console.log('✅ Password updated successfully');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testPassword(); 