import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating test rental data...');

  try {
    // Get existing users
    const tenant = await prisma.user.findUnique({
      where: { email: 'tenant@test.com' }
    });

    const landlord = await prisma.user.findUnique({
      where: { email: 'landlord@test.com' }
    });

    if (!tenant || !landlord) {
      console.log('❌ Test users not found. Please run the seed script first.');
      return;
    }

    console.log('✅ Found users:', { tenant: tenant.email, landlord: landlord.email });

    // Create a rental request
    console.log('Creating rental request...');
    const rentalRequest = await prisma.rentalRequest.create({
      data: {
        tenantId: tenant.id,
        title: 'Modern 2-Bedroom Apartment in City Center',
        location: 'ul. Krakowskie Przedmieście 15/17, Śródmieście, Warszawa 00-071',
        bedrooms: 2,
        bathrooms: 1,
        budget: 3200,
        moveInDate: new Date('2024-01-15'),
        description: 'Looking for a modern 2-bedroom apartment in the city center',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Created rental request:', rentalRequest.id);

    // Check if offer already exists for this rental request
    let offer = await prisma.offer.findFirst({
      where: {
        rentalRequestId: rentalRequest.id
      }
    });

    if (offer) {
      console.log('⚠️ Offer already exists for this rental request:', offer.id);
      console.log('Using existing offer for payments...');
    } else {
      // Create an offer for the rental request
      console.log('Creating offer...');
      offer = await prisma.offer.create({
        data: {
          rentalRequestId: rentalRequest.id,
          tenantId: tenant.id,
          landlordId: landlord.id,
          rentAmount: 3200,
          depositAmount: 3200,
          leaseDuration: 12,
          availableFrom: new Date('2024-01-15'),
          leaseEndDate: new Date('2025-01-15'),
          description: 'Beautiful 2-bedroom apartment in the heart of Warsaw',
          propertyAmenities: JSON.stringify(['Parking Space', 'Washing Machine', 'Air Conditioning', 'Balcony', 'Internet', 'Elevator']),
          propertySize: '65 m²',
          status: 'ACCEPTED',
          responseTime: 3600000, // 1 hour in milliseconds
          matchScore: 0.95
        }
      });

      console.log('✅ Created offer:', offer.id);
    }

    // Create some payments
    console.log('Creating payments...');
    const payments = [
      {
        userId: tenant.id,
        offerId: offer.id,
        amount: 3200,
        status: 'SUCCEEDED',
        purpose: 'RENT',
        gateway: 'STRIPE',
        createdAt: new Date('2024-12-01')
      },
      {
        userId: tenant.id,
        offerId: offer.id,
        amount: 3200,
        status: 'SUCCEEDED',
        purpose: 'RENT',
        gateway: 'STRIPE',
        createdAt: new Date('2024-11-01')
      },
      {
        userId: tenant.id,
        offerId: offer.id,
        amount: 3200,
        status: 'SUCCEEDED',
        purpose: 'RENT',
        gateway: 'STRIPE',
        createdAt: new Date('2024-10-01')
      },
      {
        userId: tenant.id,
        offerId: offer.id,
        amount: 3200,
        status: 'SUCCEEDED',
        purpose: 'RENT',
        gateway: 'STRIPE',
        createdAt: new Date('2024-09-01')
      },
      {
        userId: tenant.id,
        offerId: offer.id,
        amount: 3200,
        status: 'SUCCEEDED',
        purpose: 'RENT',
        gateway: 'STRIPE',
        createdAt: new Date('2024-08-01')
      }
    ];

    for (const paymentData of payments) {
      const payment = await prisma.payment.create({
        data: paymentData
      });
      console.log('✅ Created payment:', payment.id);
    }

    console.log('🎉 Test rental data created successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log('========================');
    console.log('🏠 Rental Request ID:', rentalRequest.id);
    console.log('📝 Offer ID:', offer.id);
    console.log('💰 Payments Created:', payments.length);
    console.log('👤 Tenant:', tenant.email);
    console.log('🏠 Landlord:', landlord.email);
    console.log('');
    console.log('🔗 Now login as tenant@test.com to see real data in the dashboard!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    console.error('Error details:', error.message);
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 