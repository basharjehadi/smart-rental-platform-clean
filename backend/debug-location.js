import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugLocation() {
  try {
    console.log('🔍 Debugging Location Matching...\n');

    // Get the rental request
    const rentalRequest = await prisma.rentalRequest.findFirst({
      where: { poolStatus: 'ACTIVE' }
    });

    // Get the property
    const property = await prisma.property.findFirst({
      where: { status: 'AVAILABLE' }
    });

    if (!rentalRequest || !property) {
      console.log('❌ Missing data');
      return;
    }

    console.log(`🏠 Rental Request Location: "${rentalRequest.location}"`);
    console.log(`🏢 Property City: "${property.city}"`);

    // Test different location matching approaches
    console.log('\n🔍 Testing Location Matching:');

    // Test 1: Direct contains
    const test1 = rentalRequest.location.toLowerCase().includes(property.city.toLowerCase());
    console.log(`1. Direct contains: ${test1} ("${rentalRequest.location}" contains "${property.city}")`);

    // Test 2: Prisma contains with exact case
    const test2 = rentalRequest.location.includes(property.city);
    console.log(`2. Prisma contains (exact): ${test2} ("${rentalRequest.location}" contains "${property.city}")`);

    // Test 3: Prisma contains with lowercase
    const test3 = rentalRequest.location.toLowerCase().includes(property.city.toLowerCase());
    console.log(`3. Prisma contains (lowercase): ${test3} ("${rentalRequest.location.toLowerCase()}" contains "${property.city.toLowerCase()}")`);

    // Test 4: Split and check parts
    const parts = rentalRequest.location.split(',');
    console.log(`4. Location parts: [${parts.map(p => `"${p.trim()}"`).join(', ')}]`);
    
    const cityPart = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    const districtPart = parts.length > 1 ? parts[0].trim() : parts[0].trim();
    
    console.log(`   City part: "${cityPart}"`);
    console.log(`   District part: "${districtPart}"`);
    
    const cityMatch = cityPart.toLowerCase() === property.city.toLowerCase();
    const districtMatch = districtPart.toLowerCase() === property.city.toLowerCase();
    const cityContains = cityPart.toLowerCase().includes(property.city.toLowerCase());
    const districtContains = districtPart.toLowerCase().includes(property.city.toLowerCase());
    
    console.log(`   City exact match: ${cityMatch}`);
    console.log(`   District exact match: ${districtMatch}`);
    console.log(`   City contains: ${cityContains}`);
    console.log(`   District contains: ${districtContains}`);

    // Test 5: What Prisma query would actually do
    console.log('\n🔍 Testing Prisma Query Logic:');
    
    const testQuery = await prisma.rentalRequest.findMany({
      where: {
        location: { contains: property.city }
      }
    });
    console.log(`5. Prisma query with contains("${property.city}"): ${testQuery.length} results`);

    const testQueryLower = await prisma.rentalRequest.findMany({
      where: {
        location: { contains: property.city.toLowerCase() }
      }
    });
    console.log(`6. Prisma query with contains("${property.city.toLowerCase()}"): ${testQueryLower.length} results`);

    const testQueryUpper = await prisma.rentalRequest.findMany({
      where: {
        location: { contains: property.city.toUpperCase() }
      }
    });
    console.log(`7. Prisma query with contains("${property.city.toUpperCase()}"): ${testQueryUpper.length} results`);

    // Test 8: Check if the issue is with the AND/OR structure
    console.log('\n🔍 Testing Full Query Structure:');
    
    const fullQuery = await prisma.rentalRequest.findMany({
      where: {
        AND: [
          { poolStatus: 'ACTIVE' },
          { status: 'ACTIVE' },
          {
            OR: [
              { location: { contains: property.city } },
              { location: { contains: property.city.toLowerCase() } },
              { location: { contains: property.city.toUpperCase() } }
            ]
          }
        ]
      }
    });
    console.log(`8. Full query with location OR: ${fullQuery.length} results`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLocation(); 