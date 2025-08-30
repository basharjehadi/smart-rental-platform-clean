import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugPropertyType() {
  try {
    console.log('🔍 Debugging Property Type Matching...\n');

    // Get the rental request
    const rentalRequest = await prisma.rentalRequest.findFirst({
      where: { poolStatus: 'ACTIVE' },
    });

    // Get the property
    const property = await prisma.property.findFirst({
      where: { status: 'AVAILABLE' },
    });

    if (!rentalRequest || !property) {
      console.log('❌ Missing data');
      return;
    }

    console.log(
      `🏠 Rental Request Property Type: "${rentalRequest.propertyType}"`
    );
    console.log(`🏢 Property Property Type: "${property.propertyType}"`);

    // Test property type matching
    console.log('\n🔍 Testing Property Type Matching:');

    // Test 1: Exact match
    const exactMatch = rentalRequest.propertyType === property.propertyType;
    console.log(
      `1. Exact match: ${exactMatch} ("${rentalRequest.propertyType}" === "${property.propertyType}")`
    );

    // Test 2: Case-insensitive match
    const caseInsensitiveMatch =
      rentalRequest.propertyType.toLowerCase() ===
      property.propertyType.toLowerCase();
    console.log(
      `2. Case-insensitive match: ${caseInsensitiveMatch} ("${rentalRequest.propertyType.toLowerCase()}" === "${property.propertyType.toLowerCase()}")`
    );

    // Test 3: Prisma query with exact match
    const testQuery1 = await prisma.rentalRequest.findMany({
      where: {
        propertyType: property.propertyType,
      },
    });
    console.log(
      `3. Prisma query with exact propertyType("${property.propertyType}"): ${testQuery1.length} results`
    );

    // Test 4: Prisma query with case-insensitive (this won't work in Prisma)
    console.log(
      `4. Note: Prisma doesn't support case-insensitive queries by default`
    );

    // Test 5: Check if the issue is with the AND structure
    console.log('\n🔍 Testing Full Query Structure:');

    const fullQuery = await prisma.rentalRequest.findMany({
      where: {
        AND: [
          { poolStatus: 'ACTIVE' },
          { status: 'ACTIVE' },
          { propertyType: property.propertyType },
        ],
      },
    });
    console.log(`5. Full query with propertyType: ${fullQuery.length} results`);

    // Test 6: Test each condition separately
    console.log('\n🔍 Testing Each Condition Separately:');

    const poolStatusQuery = await prisma.rentalRequest.findMany({
      where: { poolStatus: 'ACTIVE' },
    });
    console.log(`6. poolStatus = 'ACTIVE': ${poolStatusQuery.length} results`);

    const statusQuery = await prisma.rentalRequest.findMany({
      where: { status: 'ACTIVE' },
    });
    console.log(`7. status = 'ACTIVE': ${statusQuery.length} results`);

    const propertyTypeQuery = await prisma.rentalRequest.findMany({
      where: { propertyType: property.propertyType },
    });
    console.log(
      `8. propertyType = "${property.propertyType}": ${propertyTypeQuery.length} results`
    );

    // Test 9: Check if there are any rental requests with different property types
    const allPropertyTypes = await prisma.rentalRequest.findMany({
      select: { propertyType: true },
    });
    console.log(
      `\n9. All property types in rental requests: ${allPropertyTypes.map((r) => `"${r.propertyType}"`).join(', ')}`
    );

    const allPropertyPropertyTypes = await prisma.property.findMany({
      select: { propertyType: true },
    });
    console.log(
      `10. All property types in properties: ${allPropertyPropertyTypes.map((p) => `"${p.propertyType}"`).join(', ')}`
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPropertyType();
