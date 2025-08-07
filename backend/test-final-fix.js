import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFinalFix() {
  try {
    console.log('🔍 Testing Final Fix with Case-Insensitive Property Type...\n');

    // Get the landlord ID
    const landlord = await prisma.user.findFirst({
      where: { role: 'LANDLORD' }
    });

    if (!landlord) {
      console.log('❌ No landlord found');
      return;
    }

    console.log(`👤 Landlord: ${landlord.email} (ID: ${landlord.id})`);

    // Get landlord's properties
    const properties = await prisma.property.findMany({
      where: {
        landlordId: landlord.id,
        status: 'AVAILABLE'
      }
    });

    console.log(`\n🏢 Landlord Properties: ${properties.length}`);
    properties.forEach(property => {
      console.log(`   - ${property.name} (${property.city}, ${property.monthlyRent} PLN, ${property.propertyType})`);
    });

    // Get all active rental requests
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: {
        poolStatus: 'ACTIVE',
        status: 'ACTIVE'
      }
    });

    console.log(`\n🏠 Active Rental Requests: ${rentalRequests.length}`);
    rentalRequests.forEach(request => {
      console.log(`   - ${request.title} (${request.location}, ${request.budgetFrom}-${request.budgetTo} PLN, ${request.propertyType})`);
    });

    // Test the fixed query
    console.log(`\n🔍 Testing Fixed API Query Logic...`);

    if (properties.length === 0) {
      console.log('❌ No properties found - API would return empty');
      return;
    }

    // Simulate the fixed API query
    const matchingRequests = await prisma.rentalRequest.findMany({
      where: {
        AND: [
          {
            poolStatus: 'ACTIVE',
            status: 'ACTIVE'
          },
          {
            OR: properties.map(property => ({
              AND: [
                // Location matching (improved - check both city and full location)
                {
                  OR: [
                    { location: { contains: property.city } },
                    { location: { contains: property.city.toLowerCase() } },
                    { location: { contains: property.city.toUpperCase() } }
                  ]
                },
                // Budget matching
                {
                  AND: [
                    { budgetFrom: { lte: property.monthlyRent * 1.2 } },
                    { budgetTo: { gte: property.monthlyRent * 0.8 } }
                  ]
                },
                // Property type matching (case-insensitive)
                {
                  OR: [
                    { propertyType: property.propertyType },
                    { propertyType: property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) },
                    { propertyType: property.propertyType.toLowerCase() }
                  ]
                },
                // Date matching
                { moveInDate: { gte: property.availableFrom || new Date() } }
              ]
            }))
          }
        ]
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true
          }
        }
      }
    });

    console.log(`\n📊 Fixed API Query Results: ${matchingRequests.length} matches found`);
    
    if (matchingRequests.length > 0) {
      matchingRequests.forEach(request => {
        console.log(`   ✅ ${request.title} - ${request.tenant?.firstName} ${request.tenant?.lastName}`);
        console.log(`      📍 Location: ${request.location}`);
        console.log(`      💰 Budget: ${request.budgetFrom}-${request.budgetTo} PLN`);
        console.log(`      🏠 Type: ${request.propertyType}`);
      });
    } else {
      console.log('   ❌ Still no matches found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalFix(); 