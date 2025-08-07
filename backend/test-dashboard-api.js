import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testDashboardApi() {
  try {
    console.log('🔍 Testing dashboard API...');
    
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
    
    // Test the dashboard API call
    const url = `http://localhost:3001/api/tenant-dashboard/dashboard`;
    console.log('🔗 Testing URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dashboard API call successful');
      console.log('📋 Dashboard data:', JSON.stringify(data, null, 2));
      
      // Check the offer ID specifically
      console.log('\n🔍 Offer ID analysis:');
      console.log('Offer ID:', data.offerId);
      console.log('Offer ID type:', typeof data.offerId);
      console.log('Offer ID length:', data.offerId?.length);
      console.log('Has active lease:', data.hasActiveLease);
    } else {
      console.log('❌ Dashboard API call failed');
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

testDashboardApi();
