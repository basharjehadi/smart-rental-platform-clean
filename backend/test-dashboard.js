import { prisma } from './src/utils/prisma.js';

async function testDashboardQueries() {
  try {
    console.log('🔍 Testing dashboard queries...\n');

    // Test 1: Check if users exist
    console.log('1. Checking users...');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    });
    console.log('Users found:', users.length);
    users.forEach(user => console.log(`- ${user.email} (${user.role})`));

    // Test 2: Check if rental requests exist
    console.log('\n2. Checking rental requests...');
    const rentalRequests = await prisma.rentalRequest.findMany({
      select: { id: true, title: true, tenantId: true, status: true }
    });
    console.log('Rental requests found:', rentalRequests.length);
    rentalRequests.forEach(req => console.log(`- ID: ${req.id}, Title: ${req.title}, Tenant: ${req.tenantId}, Status: ${req.status}`));

    // Test 3: Check if offers exist
    console.log('\n3. Checking offers...');
    const offers = await prisma.offer.findMany({
      select: { id: true, rentalRequestId: true, status: true }
    });
    console.log('Offers found:', offers.length);
    offers.forEach(offer => console.log(`- ID: ${offer.id}, RequestID: ${offer.rentalRequestId}, Status: ${offer.status}`));

    // Test 4: Check if payments exist
    console.log('\n4. Checking payments...');
    const payments = await prisma.payment.findMany({
      select: { id: true, userId: true, amount: true, status: true }
    });
    console.log('Payments found:', payments.length);
    payments.forEach(payment => console.log(`- ID: ${payment.id}, UserID: ${payment.userId}, Amount: ${payment.amount}, Status: ${payment.status}`));

    // Test 5: Test the actual dashboard query
    console.log('\n5. Testing dashboard query...');
    const tenant = users.find(u => u.role === 'TENANT');
    if (tenant) {
      console.log(`Testing with tenant: ${tenant.email} (${tenant.id})`);
      
      const activeLease = await prisma.offer.findFirst({
        where: {
          rentalRequest: {
            tenantId: tenant.id
          },
          status: 'ACCEPTED'
        },
        include: {
          rentalRequest: {
            include: {
              tenant: true
            }
          },
          landlord: {
            include: {
              properties: true
            }
          }
        }
      });

      console.log('Active lease found:', !!activeLease);
      if (activeLease) {
        console.log('- Offer ID:', activeLease.id);
        console.log('- Rental Request ID:', activeLease.rentalRequestId);
        console.log('- Landlord:', activeLease.landlord.email);
      }

      const payments = await prisma.payment.findMany({
        where: {
          userId: tenant.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      console.log('Payments found for tenant:', payments.length);
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardQueries(); 