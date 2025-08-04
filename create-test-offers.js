import { prisma } from './backend/src/utils/prisma.js';
import bcrypt from 'bcrypt';

const createTestOffers = async () => {
  try {
    console.log('🏗️ Creating comprehensive test offers...\n');

    // First, ensure we have a tenant user
    const tenant = await prisma.user.upsert({
      where: { email: 'tenant@test.com' },
      update: {},
      create: {
        email: 'tenant@test.com',
        name: 'John Tenant',
        password: await bcrypt.hash('tenant123', 10),
        role: 'TENANT'
      }
    });

    // Ensure we have landlord users
    const landlord1 = await prisma.user.upsert({
      where: { email: 'landlord1@test.com' },
      update: {},
      create: {
        email: 'landlord1@test.com',
        name: 'Anna Kowalski',
        password: await bcrypt.hash('landlord123', 10),
        role: 'LANDLORD',
        phoneNumber: '+48 123 456 789'
      }
    });

    const landlord2 = await prisma.user.upsert({
      where: { email: 'landlord2@test.com' },
      update: {},
      create: {
        email: 'landlord2@test.com',
        name: 'Piotr Nowak',
        password: await bcrypt.hash('landlord123', 10),
        role: 'LANDLORD',
        phoneNumber: '+48 987 654 321'
      }
    });

    const landlord3 = await prisma.user.upsert({
      where: { email: 'landlord3@test.com' },
      update: {},
      create: {
        email: 'landlord3@test.com',
        name: 'Maria Wiśniewska',
        password: await bcrypt.hash('landlord123', 10),
        role: 'LANDLORD',
        phoneNumber: '+48 555 123 456'
      }
    });

    console.log('✅ Users created/verified');

    // Create rental requests for the tenant
    const request1 = await prisma.rentalRequest.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Modern 2-Bedroom Apartment Needed',
        description: 'Looking for a modern, well-maintained 2-bedroom apartment in Warsaw. Must be pet-friendly and have parking.',
        location: 'Warszawa, Mokotów',
        budget: 3500,
        budgetFrom: 3000,
        budgetTo: 4000,
        bedrooms: 2,
        moveInDate: new Date('2025-03-01'),
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });

    const request2 = await prisma.rentalRequest.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: 'Studio Apartment in City Center',
        description: 'Seeking a cozy studio apartment in the heart of Warsaw. Close to public transport and amenities.',
        location: 'Warszawa, Śródmieście',
        budget: 2500,
        budgetFrom: 2000,
        budgetTo: 3000,
        bedrooms: 1,
        moveInDate: new Date('2025-02-15'),
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });

    const request3 = await prisma.rentalRequest.upsert({
      where: { id: 3 },
      update: {},
      create: {
        title: 'Family Home in Quiet Neighborhood',
        description: 'Looking for a 3-bedroom family home in a quiet, residential area. Garden preferred.',
        location: 'Warszawa, Wilanów',
        budget: 5000,
        budgetFrom: 4500,
        budgetTo: 6000,
        bedrooms: 3,
        moveInDate: new Date('2025-04-01'),
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });

    console.log('✅ Rental requests created');

    // Clear existing offers for these requests
    await prisma.offer.deleteMany({
      where: {
        rentalRequestId: {
          in: [request1.id, request2.id, request3.id]
        }
      }
    });

    // Create offers with different statuses
    const offers = [
      // ACTIVE offers
      {
        rentalRequestId: request1.id,
        landlordId: landlord1.id,
        rentAmount: 3800,
        depositAmount: 3800,
        leaseDuration: 12,
        description: 'Beautiful modern apartment with balcony, fully furnished. Includes utilities and parking space.',
        utilitiesIncluded: true,
        availableFrom: new Date('2025-03-01'),
        status: 'PENDING',
        propertyAddress: 'ul. Puławska 25, Warszawa',
        propertyImages: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
        ]),
        propertyType: 'Apartment',
        propertySize: '75m²',
        propertyAmenities: JSON.stringify(['Balcony', 'Parking', 'Furnished', 'Air Conditioning', 'Washing Machine']),
        propertyDescription: 'Modern 2-bedroom apartment in excellent location. Recently renovated with high-quality finishes.',
        rulesText: 'No smoking, pets allowed with deposit. Quiet hours 22:00-07:00.'
      },
      {
        rentalRequestId: request1.id,
        landlordId: landlord2.id,
        rentAmount: 3600,
        depositAmount: 3600,
        leaseDuration: 12,
        description: 'Cozy apartment in quiet building, perfect for young professionals. Close to metro station.',
        utilitiesIncluded: false,
        availableFrom: new Date('2025-03-01'),
        status: 'PENDING',
        propertyAddress: 'ul. Marszałkowska 15, Warszawa',
        propertyImages: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
          'https://images.unsplash.com/photo-1560448075-8c07e35f25f1?w=800'
        ]),
        propertyType: 'Apartment',
        propertySize: '65m²',
        propertyAmenities: JSON.stringify(['Balcony', 'Storage', 'Furnished', 'Heating Included']),
        propertyDescription: 'Well-maintained apartment in a quiet neighborhood. Great for families or professionals.',
        rulesText: 'No pets, no smoking. Monthly cleaning required.'
      },
      {
        rentalRequestId: request2.id,
        landlordId: landlord3.id,
        rentAmount: 2800,
        depositAmount: 2800,
        leaseDuration: 6,
        description: 'Charming studio in historic building, fully renovated. Perfect for students or young professionals.',
        utilitiesIncluded: true,
        availableFrom: new Date('2025-02-15'),
        status: 'PENDING',
        propertyAddress: 'ul. Nowy Świat 45, Warszawa',
        propertyImages: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
          'https://images.unsplash.com/photo-1560448075-8c07e35f25f1?w=800'
        ]),
        propertyType: 'Studio',
        propertySize: '35m²',
        propertyAmenities: JSON.stringify(['Furnished', 'WiFi', 'Utilities Included', 'Security System']),
        propertyDescription: 'Beautiful studio apartment in the heart of Warsaw. Walking distance to all amenities.',
        rulesText: 'No pets, no parties. Quiet building suitable for students.'
      },
      // ACCEPTED offer
      {
        rentalRequestId: request1.id,
        landlordId: landlord1.id,
        rentAmount: 3700,
        depositAmount: 3700,
        leaseDuration: 12,
        description: 'Excellent apartment with great amenities. Recently renovated kitchen and bathroom.',
        utilitiesIncluded: true,
        availableFrom: new Date('2025-03-01'),
        status: 'ACCEPTED',
        paymentIntentId: 'pi_test_accepted_123',
        propertyAddress: 'ul. Mokotowska 12, Warszawa',
        propertyImages: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
        ]),
        propertyType: 'Apartment',
        propertySize: '70m²',
        propertyAmenities: JSON.stringify(['Balcony', 'Parking', 'Furnished', 'Air Conditioning']),
        propertyDescription: 'Spacious 2-bedroom apartment with modern amenities. Perfect location near parks and shopping.',
        rulesText: 'Pets allowed with additional deposit. Monthly rent due on 1st of each month.'
      },
      // DECLINED offer
      {
        rentalRequestId: request2.id,
        landlordId: landlord2.id,
        rentAmount: 3200,
        depositAmount: 3200,
        leaseDuration: 12,
        description: 'Nice studio apartment, but slightly above your budget. Includes all utilities.',
        utilitiesIncluded: true,
        availableFrom: new Date('2025-02-15'),
        status: 'DECLINED',
        propertyAddress: 'ul. Krakowska 8, Warszawa',
        propertyImages: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800'
        ]),
        propertyType: 'Studio',
        propertySize: '40m²',
        propertyAmenities: JSON.stringify(['Furnished', 'Utilities Included', 'Security']),
        propertyDescription: 'Modern studio apartment with good location. Slightly above budget but includes all utilities.',
        rulesText: 'No pets, no smoking. Quiet hours enforced.'
      },
      // EXPIRED offer
      {
        rentalRequestId: request3.id,
        landlordId: landlord3.id,
        rentAmount: 4800,
        depositAmount: 4800,
        leaseDuration: 12,
        description: 'Beautiful family home with garden. Perfect for families with children.',
        utilitiesIncluded: false,
        availableFrom: new Date('2025-01-01'), // Past date
        status: 'PENDING',
        propertyAddress: 'ul. Wilanowska 30, Warszawa',
        propertyImages: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
        ]),
        propertyType: 'House',
        propertySize: '120m²',
        propertyAmenities: JSON.stringify(['Garden', 'Parking', 'Furnished', 'Fireplace', 'Basement']),
        propertyDescription: 'Spacious family home with beautiful garden. Quiet neighborhood, perfect for families.',
        rulesText: 'Pets welcome, garden maintenance included. Family-oriented neighborhood.'
      }
    ];

    // Create all offers
    for (const offerData of offers) {
      await prisma.offer.create({
        data: offerData
      });
    }

    console.log('✅ All test offers created successfully!');
    
    // Display summary
    const offerCounts = await prisma.offer.groupBy({
      by: ['status'],
      where: {
        rentalRequest: {
          tenantId: tenant.id
        }
      },
      _count: {
        status: true
      }
    });

    console.log('\n📊 Offer Summary:');
    offerCounts.forEach(count => {
      console.log(`   ${count.status}: ${count._count.status} offers`);
    });

    console.log('\n🎉 Test data ready!');
    console.log('\n📋 Login Credentials:');
    console.log('   Tenant: tenant@test.com / tenant123');
    console.log('   Landlord 1: landlord1@test.com / landlord123');
    console.log('   Landlord 2: landlord2@test.com / landlord123');
    console.log('   Landlord 3: landlord3@test.com / landlord123');

    console.log('\n🔗 Test the tenant view offer page at: http://localhost:5173/my-offers');

  } catch (error) {
    console.error('❌ Error creating test offers:', error);
  } finally {
    await prisma.$disconnect();
  }
};

createTestOffers(); 