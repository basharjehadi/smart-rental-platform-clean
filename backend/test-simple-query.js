import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSimpleQuery() {
  try {
    console.log('🔍 Testing simple database query...');
    
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
    
    // Test the simple query
    const activeLease = await prisma.offer.findFirst({
      where: {
        rentalRequest: {
          tenantId: tenant.id
        },
        status: 'PAID'
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        landlord: true
      }
    });
    
    console.log('✅ Query executed successfully');
    console.log('Active lease found:', activeLease ? 'Yes' : 'No');
    
    if (activeLease) {
      console.log('Active lease ID:', activeLease.id);
      console.log('Active lease status:', activeLease.status);
      console.log('Landlord name:', activeLease.landlord.name);
      console.log('Tenant name:', activeLease.rentalRequest.tenant.name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleQuery();
