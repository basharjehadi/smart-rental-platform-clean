import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMatching() {
  try {
    console.log('🔍 Debugging matching logic...\n');

    // Get the rental request
    const rentalRequest = await prisma.rentalRequest.findFirst({
      include: {
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!rentalRequest) {
      console.log('❌ No rental request found');
      return;
    }

    console.log('📝 Rental Request:');
    console.log(`  - ID: ${rentalRequest.id}`);
    console.log(`  - Title: "${rentalRequest.title}"`);
    console.log(`  - Location: ${rentalRequest.location}`);
    console.log(`  - City: ${rentalRequest.city || 'NULL'}`);
    console.log(`  - Budget: ${rentalRequest.budget} PLN`);
    console.log(`  - Budget From: ${rentalRequest.budgetFrom || 'NULL'}`);
    console.log(`  - Budget To: ${rentalRequest.budgetTo || 'NULL'}`);
    console.log(`  - Property Type: ${rentalRequest.propertyType || 'NULL'}`);
    console.log(`  - Bedrooms: ${rentalRequest.bedrooms || 'NULL'}`);
    console.log(`  - Move-in Date: ${rentalRequest.moveInDate}`);
    console.log(
      `  - Tenant: ${rentalRequest.tenant.name} (${rentalRequest.tenant.email})`
    );

    // Get the property
    const property = await prisma.property.findFirst({
      include: {
        landlord: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      console.log('❌ No property found');
      return;
    }

    console.log('\n🏠 Property:');
    console.log(`  - ID: ${property.id}`);
    console.log(`  - Name: ${property.name}`);
    console.log(`  - City: ${property.city || 'NULL'}`);
    console.log(`  - Address: ${property.address || 'NULL'}`);
    console.log(`  - Monthly Rent: ${property.monthlyRent} PLN`);
    console.log(`  - Property Type: ${property.propertyType || 'NULL'}`);
    console.log(`  - Bedrooms: ${property.bedrooms || 'NULL'}`);
    console.log(`  - Available From: ${property.availableFrom || 'NULL'}`);
    console.log(
      `  - Landlord: ${property.landlord.name} (${property.landlord.email})`
    );

    // Test the matching logic
    console.log('\n🔍 Testing Matching Logic:');

    // Location matching
    const requestCity =
      rentalRequest.city ||
      rentalRequest.location.split(',')[1]?.trim() ||
      rentalRequest.location.trim();
    console.log(`  📍 Request City (extracted): "${requestCity}"`);
    console.log(`  🏠 Property City: "${property.city}"`);
    console.log(
      `  📍 Location Match: ${requestCity.toLowerCase() === property.city.toLowerCase() ? '✅ YES' : '❌ NO'}`
    );

    // Budget matching
    const maxBudget =
      rentalRequest.budgetTo * 1.5 || rentalRequest.budget * 1.5;
    console.log(`  💰 Request Budget: ${rentalRequest.budget} PLN`);
    console.log(`  💰 Request Budget To: ${rentalRequest.budgetTo || 'NULL'}`);
    console.log(`  💰 Max Budget (1.5x): ${maxBudget} PLN`);
    console.log(`  💰 Property Rent: ${property.monthlyRent} PLN`);
    console.log(
      `  💰 Budget Match: ${property.monthlyRent <= maxBudget ? '✅ YES' : '❌ NO'}`
    );

    // Move-in date matching
    const moveInDate = new Date(rentalRequest.moveInDate);
    const availableFrom = property.availableFrom
      ? new Date(property.availableFrom)
      : null;
    console.log(`  📅 Request Move-in: ${moveInDate}`);
    console.log(`  📅 Property Available: ${availableFrom}`);
    console.log(
      `  📅 Date Match: ${availableFrom && availableFrom <= moveInDate ? '✅ YES' : '❌ NO'}`
    );

    // Test the actual query
    console.log('\n🔍 Testing Actual Database Query:');

    const matchingLandlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD',
        properties: {
          some: {
            city: {
              equals: requestCity,
              mode: 'insensitive',
            },
            monthlyRent: {
              lte: maxBudget,
            },
            availableFrom: {
              lte: moveInDate,
            },
          },
        },
      },
      include: {
        properties: {
          where: {
            city: {
              equals: requestCity,
              mode: 'insensitive',
            },
            monthlyRent: {
              lte: maxBudget,
            },
            availableFrom: {
              lte: moveInDate,
            },
          },
        },
      },
    });

    console.log(`  🔍 Found ${matchingLandlords.length} matching landlords`);
    matchingLandlords.forEach((landlord) => {
      console.log(`    👤 ${landlord.name} (${landlord.email})`);
      landlord.properties.forEach((prop) => {
        console.log(
          `      🏢 ${prop.name} - ${prop.city}, ${prop.monthlyRent} PLN`
        );
      });
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMatching();
