import { prisma } from './backend/src/utils/prisma.js';

const testMatchingLogic = async () => {
  try {
    console.log('🔍 Testing Matching Logic Directly...\n');
    
    // Get the latest rental request
    const rentalRequest = await prisma.rentalRequest.findFirst({
      where: { poolStatus: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!rentalRequest) {
      console.log('❌ No active rental requests found');
      return;
    }
    
    console.log(`📋 Testing with rental request: ${rentalRequest.title}`);
    console.log(`   Location: ${rentalRequest.location}`);
    console.log(`   Budget: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN`);
    console.log(`   Bedrooms: ${rentalRequest.bedrooms}`);
    console.log(`   Move-in: ${rentalRequest.moveInDate}`);
    
    // Get all landlords with properties
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            monthlyRent: true,
            bedrooms: true,
            availableFrom: true
          }
        }
      }
    });
    
    console.log(`\n👥 Found ${landlords.length} landlords with properties`);
    
    landlords.forEach(landlord => {
      console.log(`\n👤 Landlord ${landlord.id} (${landlord.email}):`);
      console.log(`   Properties: ${landlord.properties.length}`);
      
      landlord.properties.forEach(property => {
        console.log(`   🏢 ${property.name}:`);
        console.log(`      City: ${property.city}`);
        console.log(`      Address: ${property.address}`);
        console.log(`      Rent: ${property.monthlyRent} PLN`);
        console.log(`      Bedrooms: ${property.bedrooms}`);
        console.log(`      Available: ${property.availableFrom}`);
        
        // Test location matching
        const locationMatch = property.city.includes(rentalRequest.location.split(',')[0].trim()) ||
                             property.address.includes(rentalRequest.location.split(',')[0].trim());
        console.log(`      📍 Location match: ${locationMatch ? '✅' : '❌'}`);
        
        // Test budget matching
        const budgetMatch = property.monthlyRent >= rentalRequest.budgetFrom && 
                           property.monthlyRent <= rentalRequest.budgetTo;
        console.log(`      💰 Budget match: ${budgetMatch ? '✅' : '❌'} (${property.monthlyRent} PLN vs ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN)`);
        
        // Test bedrooms matching
        const bedroomsMatch = rentalRequest.bedrooms ? property.bedrooms === rentalRequest.bedrooms : true;
        console.log(`      🏠 Bedrooms match: ${bedroomsMatch ? '✅' : '❌'} (${property.bedrooms} vs ${rentalRequest.bedrooms})`);
        
        // Test availability matching
        const moveInDate = new Date(rentalRequest.moveInDate);
        const availableFrom = new Date(property.availableFrom);
        const availabilityMatch = availableFrom <= moveInDate;
        console.log(`      📅 Availability match: ${availabilityMatch ? '✅' : '❌'} (${availableFrom.toDateString()} <= ${moveInDate.toDateString()})`);
        
        // Overall match
        const overallMatch = locationMatch && budgetMatch && bedroomsMatch && availabilityMatch;
        console.log(`      🎯 Overall match: ${overallMatch ? '✅' : '❌'}`);
      });
    });
    
    // Test the actual query that should find matches
    console.log('\n🔍 Testing the actual matching query...');
    
    const matchingLandlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD',
        properties: {
          some: {
            // Location matching
            OR: [
              { city: { contains: rentalRequest.location.split(',')[0].trim() } },
              { address: { contains: rentalRequest.location.split(',')[0].trim() } }
            ],
            // Budget matching
            monthlyRent: {
              gte: rentalRequest.budgetFrom,
              lte: rentalRequest.budgetTo
            },
            // Bedrooms matching (if specified)
            ...(rentalRequest.bedrooms && {
              bedrooms: rentalRequest.bedrooms
            }),
            // Property is available
            availableFrom: {
              lte: new Date(rentalRequest.moveInDate)
            }
          }
        }
      },
      include: {
        properties: {
          where: {
            // Location matching
            OR: [
              { city: { contains: rentalRequest.location.split(',')[0].trim() } },
              { address: { contains: rentalRequest.location.split(',')[0].trim() } }
            ],
            // Budget matching
            monthlyRent: {
              gte: rentalRequest.budgetFrom,
              lte: rentalRequest.budgetTo
            },
            // Bedrooms matching (if specified)
            ...(rentalRequest.bedrooms && {
              bedrooms: rentalRequest.bedrooms
            }),
            // Property is available
            availableFrom: {
              lte: new Date(rentalRequest.moveInDate)
            }
          },
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            monthlyRent: true,
            bedrooms: true,
            availableFrom: true
          }
        }
      }
    });
    
    console.log(`\n🎯 Query found ${matchingLandlords.length} matching landlords`);
    
    if (matchingLandlords.length === 0) {
      console.log('\n❌ No matches found. Let\'s debug each condition...');
      
      // Test each condition separately
      const locationMatches = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          properties: {
            some: {
              OR: [
                { city: { contains: rentalRequest.location.split(',')[0].trim() } },
                { address: { contains: rentalRequest.location.split(',')[0].trim() } }
              ]
            }
          }
        }
      });
      console.log(`   📍 Location matches: ${locationMatches.length}`);
      
      const budgetMatches = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          properties: {
            some: {
              monthlyRent: {
                gte: rentalRequest.budgetFrom,
                lte: rentalRequest.budgetTo
              }
            }
          }
        }
      });
      console.log(`   💰 Budget matches: ${budgetMatches.length}`);
      
      const bedroomsMatches = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          properties: {
            some: {
              bedrooms: rentalRequest.bedrooms
            }
          }
        }
      });
      console.log(`   🏠 Bedrooms matches: ${bedroomsMatches.length}`);
      
      const availabilityMatches = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          properties: {
            some: {
              availableFrom: {
                lte: new Date(rentalRequest.moveInDate)
              }
            }
          }
        }
      });
      console.log(`   📅 Availability matches: ${availabilityMatches.length}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testMatchingLogic(); 