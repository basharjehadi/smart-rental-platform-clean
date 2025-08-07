import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMatching() {
  try {
    console.log('🔍 Checking Property and Rental Request Details...\n');

    // Get all properties
    const properties = await prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        monthlyRent: true,
        propertyType: true,
        bedrooms: true,
        availableFrom: true,
        landlordId: true,
        status: true
      }
    });

    console.log(`📊 Total Properties: ${properties.length}`);
    properties.forEach(property => {
      console.log(`\n🏢 Property: ${property.name}`);
      console.log(`   📍 City: ${property.city}`);
      console.log(`   📍 Address: ${property.address}`);
      console.log(`   💰 Rent: ${property.monthlyRent} PLN`);
      console.log(`   🏠 Type: ${property.propertyType}`);
      console.log(`   🛏️ Bedrooms: ${property.bedrooms}`);
      console.log(`   📅 Available From: ${property.availableFrom}`);
      console.log(`   📊 Status: ${property.status}`);
      console.log(`   👤 Landlord ID: ${property.landlordId}`);
    });

    // Get all rental requests
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: { poolStatus: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        location: true,
        budget: true,
        budgetFrom: true,
        budgetTo: true,
        propertyType: true,
        bedrooms: true,
        moveInDate: true,
        poolStatus: true,
        tenantId: true
      }
    });

    console.log(`\n📋 Total Rental Requests: ${rentalRequests.length}`);
    rentalRequests.forEach(request => {
      console.log(`\n🏠 Rental Request: ${request.title}`);
      console.log(`   📍 Location: ${request.location}`);
      console.log(`   💰 Budget: ${request.budget} PLN`);
      console.log(`   💰 Budget Range: ${request.budgetFrom} - ${request.budgetTo} PLN`);
      console.log(`   🏠 Type: ${request.propertyType}`);
      console.log(`   🛏️ Bedrooms: ${request.bedrooms}`);
      console.log(`   📅 Move-in Date: ${request.moveInDate}`);
      console.log(`   📊 Pool Status: ${request.poolStatus}`);
      console.log(`   👤 Tenant ID: ${request.tenantId}`);
    });

    // Check for matches
    console.log('\n🔍 Checking for Matches...\n');
    
    rentalRequests.forEach(request => {
      console.log(`\n🎯 Checking matches for request: ${request.title}`);
      
      properties.forEach(property => {
        // Location matching
        const locationMatch = property.city.toLowerCase().includes(request.location.toLowerCase()) || 
                             property.address.toLowerCase().includes(request.location.toLowerCase());
        
        // Budget matching
        const budgetMatch = property.monthlyRent >= (request.budgetFrom || request.budget * 0.8) && 
                           property.monthlyRent <= (request.budgetTo || request.budget * 1.2);
        
        // Property type matching
        const typeMatch = !request.propertyType || 
                         property.propertyType.toLowerCase() === request.propertyType.toLowerCase();
        
        // Date matching
        const dateMatch = new Date(property.availableFrom) <= new Date(request.moveInDate);
        
        // Bedrooms matching
        const bedroomsMatch = !request.bedrooms || property.bedrooms === request.bedrooms;
        
        const allMatch = locationMatch && budgetMatch && typeMatch && dateMatch && bedroomsMatch;
        
        console.log(`   🏢 Property: ${property.name}`);
        console.log(`      📍 Location: ${locationMatch ? '✅' : '❌'} (Property: "${property.city}", Request: "${request.location}")`);
        console.log(`      💰 Budget: ${budgetMatch ? '✅' : '❌'} (Property: ${property.monthlyRent}, Request: ${request.budgetFrom}-${request.budgetTo})`);
        console.log(`      🏠 Type: ${typeMatch ? '✅' : '❌'} (Property: "${property.propertyType}", Request: "${request.propertyType}")`);
        console.log(`      📅 Date: ${dateMatch ? '✅' : '❌'} (Property: ${property.availableFrom}, Request: ${request.moveInDate})`);
        console.log(`      🛏️ Bedrooms: ${bedroomsMatch ? '✅' : '❌'} (Property: ${property.bedrooms}, Request: ${request.bedrooms})`);
        console.log(`      🎯 Overall: ${allMatch ? '✅ MATCH!' : '❌ No Match'}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatching(); 