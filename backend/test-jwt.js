import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testJWT() {
  try {
    console.log('🔍 Testing JWT token...');
    
    // Get the tenant user
    const tenant = await prisma.user.findFirst({
      where: {
        role: 'TENANT'
      }
    });
    
    if (!tenant) {
      console.log('❌ No tenant found');
      return;
    }
    
    console.log('✅ Found tenant:', tenant.id);
    
    // Create a JWT token
    const token = jwt.sign(
      { 
        userId: tenant.id,
        email: tenant.email,
        role: tenant.role
      },
      'your_super_secret_jwt_key_for_smart_rental_system_2024',
      { expiresIn: '1h' }
    );
    
    console.log('✅ JWT token created');
    console.log('Token:', token);
    
    // Verify the token
    const decoded = jwt.verify(token, 'your_super_secret_jwt_key_for_smart_rental_system_2024');
    console.log('✅ JWT token verified');
    console.log('Decoded:', decoded);
    
    // Test the authentication middleware logic
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    if (user) {
      console.log('✅ User found in database');
      console.log('User:', user);
    } else {
      console.log('❌ User not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJWT();
