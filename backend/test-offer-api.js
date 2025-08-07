import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testOfferApi() {
  try {
    console.log('🔍 Testing offer API...');
    
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
    
    // Create a test token
    const token = jwt.sign(
      { id: tenant.id, email: tenant.email, role: tenant.role },
      'your_super_secret_jwt_key_for_smart_rental_system_2024',
      { expiresIn: '1h' }
    );
    
    console.log('✅ Generated token');
    
    // Get the offer ID
    const offer = await prisma.offer.findFirst({
      where: {
        status: 'PAID',
        rentalRequest: {
          tenantId: tenant.id
        }
      }
    });
    
    if (!offer) {
      console.log('❌ No paid offer found for tenant');
      return;
    }
    
    console.log('✅ Found offer:', offer.id);
    
    // Test the API call
    const url = `http://localhost:3001/api/tenant/offer/${offer.id}`;
    console.log('🔗 Testing URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log('📋 Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API call failed');
      console.log('Status:', response.status);
      const errorData = await response.text();
      console.log('Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOfferApi();
