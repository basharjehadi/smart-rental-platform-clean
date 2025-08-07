import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIEndpoint() {
  try {
    console.log('🔍 Testing Rental Requests API Endpoint...\n');

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
      console.log(`   - ${property.name} (${property.city}, ${property.monthlyRent} PLN)`);
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
      console.log(`   - ${request.title} (${request.location}, ${request.budgetFrom}-${request.budgetTo} PLN)`);
    });

    // Test the exact query that the API uses
    console.log(`\n🔍 Testing API Query Logic...`);

    if (properties.length === 0) {
      console.log('❌ No properties found - API would return empty');
      return;
    }

    // Simulate the API query
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
                // Location matching
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
                // Property type matching
                { propertyType: property.propertyType },
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

    console.log(`\n📊 API Query Results: ${matchingRequests.length} matches found`);
    
    if (matchingRequests.length > 0) {
      matchingRequests.forEach(request => {
        console.log(`   ✅ ${request.title} - ${request.tenant?.firstName} ${request.tenant?.lastName}`);
      });
    } else {
      console.log('   ❌ No matches found');
      
      // Debug each property's matching criteria
      console.log('\n🔍 Debugging each property:');
      properties.forEach(property => {
        console.log(`\n   Property: ${property.name}`);
        
        // Test location matching
        const locationMatches = rentalRequests.filter(req => 
          req.location.toLowerCase().includes(property.city.toLowerCase())
        );
        console.log(`     📍 Location matches: ${locationMatches.length}`);
        
        // Test budget matching
        const budgetMatches = rentalRequests.filter(req => 
          req.budgetFrom <= property.monthlyRent * 1.2 && 
          req.budgetTo >= property.monthlyRent * 0.8
        );
        console.log(`     💰 Budget matches: ${budgetMatches.length}`);
        
        // Test type matching
        const typeMatches = rentalRequests.filter(req => 
          req.propertyType.toLowerCase() === property.propertyType.toLowerCase()
        );
        console.log(`     🏠 Type matches: ${typeMatches.length}`);
        
        // Test date matching
        const dateMatches = rentalRequests.filter(req => 
          new Date(req.moveInDate) >= new Date(property.availableFrom || new Date())
        );
        console.log(`     📅 Date matches: ${dateMatches.length}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIEndpoint(); 